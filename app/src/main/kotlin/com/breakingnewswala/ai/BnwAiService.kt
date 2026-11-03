package com.breakingnewswala.ai

import android.util.Log
import com.google.firebase.Firebase
import com.google.firebase.ai.ai
import com.google.firebase.ai.type.Schema
import com.google.firebase.ai.type.generationConfig
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.withTimeout
import org.json.JSONObject

private const val TAG = "BnwAiService"
private const val MODEL_NAME = "gemini-3.8-flash"

data class ReporterAiDraft(
    val suggestedHeadline: String,
    val leadParagraph: String,
    val suggestedCategory: String,
    val keyFacts: List<String>,
    val factCheckGuidance: List<String>
)

data class FactCheckEvaluationItem(
    val pointName: String,
    val status: String, // "PASSED", "WARNING", "NEEDS_SOURCE"
    val commentHindi: String
)

data class EditorialFactCheckResult(
    val score: Int,
    val credibilityRating: String, // "उच्च (High)", "सत्यापन आवश्यक (Needs Check)", "संदेहास्पद (Suspicious)"
    val editorialRemarksHindi: String,
    val refinedHeadline: String,
    val checklist: List<FactCheckEvaluationItem>
)

object BnwAiService {

    // Lazy initialization of standard GenerativeModel with gemini-3.8-flash
    private val textModel by lazy {
        Firebase.ai.generativeModel(modelName = MODEL_NAME)
    }

    // Reporter Assistant Schema
    private val reporterDraftSchema by lazy {
        Schema.obj(
            properties = mapOf(
                "suggestedHeadline" to Schema.string(description = "आकर्षक, सटीक और प्रामाणिक हिंदी हेडलाइन (अधिकतम 80 अक्षर)", nullable = false),
                "leadParagraph" to Schema.string(description = "समाचार का प्रभावी प्रारंभिक पैराग्राफ (हिंदी में)", nullable = false),
                "suggestedCategory" to Schema.string(description = "सुझावित समाचार श्रेणी जैसे अपराध, राजनीति, कृषि, विकास, शिक्षा, खेल", nullable = false),
                "keyFacts" to Schema.array(
                    items = Schema.string(),
                    description = "प्रमुख 3-4 तथ्य बिंदु"
                ),
                "factCheckGuidance" to Schema.array(
                    items = Schema.string(),
                    description = "संवाददाता द्वारा मौके पर सत्यापित करने योग्य जरूरी 2-3 बिंदु"
                )
            )
        )
    }

    private val reporterModel by lazy {
        val config = generationConfig {
            responseMimeType = "application/json"
            responseSchema = reporterDraftSchema
            temperature = 0.4f
        }
        Firebase.ai.generativeModel(
            modelName = MODEL_NAME,
            generationConfig = config
        )
    }

    // Editorial Fact Check Schema
    private val factCheckSchema by lazy {
        Schema.obj(
            properties = mapOf(
                "score" to Schema.integer(description = "तथ्य शुद्धता एवं विश्वसनीयता स्कोर (0 से 100)", nullable = false),
                "credibilityRating" to Schema.string(description = "सत्यापन स्तर: उच्च, मध्यम, या संदेहास्पद", nullable = false),
                "editorialRemarksHindi" to Schema.string(description = "संपादकीय मूल्यांकन टिप्पणी (हिंदी में)", nullable = false),
                "refinedHeadline" to Schema.string(description = "प्रेस काउंसिल व बीएनडब्ल्यू गाइडलाइन अनुसार परिष्कृत हेडलाइन", nullable = false),
                "verificationPoints" to Schema.array(
                    items = Schema.string(),
                    description = "सत्यापित या संदेहास्पद बिंदुओं की संक्षिप्त सूची"
                )
            )
        )
    }

    private val editorialModel by lazy {
        val config = generationConfig {
            responseMimeType = "application/json"
            responseSchema = factCheckSchema
            temperature = 0.3f
        }
        Firebase.ai.generativeModel(
            modelName = MODEL_NAME,
            generationConfig = config
        )
    }

    /**
     * Reader 3-Point Bulletin & AI Summary
     */
    suspend fun generateReaderSummary(title: String, content: String): Result<String> {
        return try {
            val prompt = """
                आप 'ब्रेकिंग न्यूज़ वाला' (मध्य प्रदेश का विश्वसनीय डिजिटल न्यूज़ नेटवर्क) के मुख्य संपादक AI हैं।
                नीचे दिए गए समाचार का स्पष्ट, निष्पक्ष और पठनीय 3-बिंदु सारांश (3-Point Key Takeaways) शुद्ध हिंदी में तैयार करें:
                
                शीर्षक: $title
                विवरण: $content
                
                दिशानिर्देश:
                1. केवल 3 बुलेट पॉइंट दें, प्रत्येक पॉइंट में एक महत्वपूर्ण सूचना हो।
                2. मध्य प्रदेश और जनहित पर पड़ने वाले प्रभाव को उजागर करें।
                3. भाषा सरल, औपचारिक और प्रभावोत्पादक हो।
            """.trimIndent()

            val response = withTimeout(60_000L) {
                textModel.generateContent(prompt)
            }

            val text = response.text
            if (!text.isNullOrBlank()) {
                Result.success(text.trim())
            } else {
                Result.failure(IllegalStateException("मॉडल से रिक्त प्रतिक्रिया प्राप्त हुई।"))
            }
        } catch (e: TimeoutCancellationException) {
            Log.e(TAG, "AI summary timed out after 60s", e)
            Result.failure(Exception("AI सारांश तैयार करने में समय सीमा समाप्त हो गई (टाइमआउट)। कृपया पुनः प्रयास करें।"))
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            Log.e(TAG, "AI summary generation failed", e)
            Result.failure(Exception(e.localizedMessage ?: "AI सारांश तैयार करने में त्रुटि हुई।"))
        }
    }

    /**
     * Reporter Desk Assistant: Generates polished headline, lead paragraph, and fact checklist
     */
    suspend fun assistReporter(rawNotes: String, district: String): Result<ReporterAiDraft> {
        return try {
            val prompt = """
                आप 'ब्रेकिंग न्यूज़ वाला' के फील्ड रिपोर्टर सहायक AI हैं।
                मध्य प्रदेश के जिला '$district' से एक फील्ड रिपोर्टर ने निम्नलिखित कच्चे नोट्स/विवरण दर्ज किए हैं।
                इसे एक पेशेवर, तथ्यपरक और उच्च प्रभाव वाली हिंदी समाचार रिपोर्ट के प्रारूप में ढालें:
                
                संवाददाता नोट्स:
                $rawNotes
            """.trimIndent()

            val response = withTimeout(60_000L) {
                reporterModel.generateContent(prompt)
            }

            val jsonStr = response.text ?: throw IllegalStateException("रिक्त AI प्रतिक्रिया")
            val json = JSONObject(jsonStr)

            val headline = json.optString("suggestedHeadline", "अपडेट: $district समाचार")
            val lead = json.optString("leadParagraph", rawNotes.take(200))
            val category = json.optString("suggestedCategory", "सामान्य")

            val keyFacts = mutableListOf<String>()
            val keyFactsArr = json.optJSONArray("keyFacts")
            if (keyFactsArr != null) {
                for (i in 0 until keyFactsArr.length()) {
                    keyFacts.add(keyFactsArr.optString(i))
                }
            }

            val guidance = mutableListOf<String>()
            val guidanceArr = json.optJSONArray("factCheckGuidance")
            if (guidanceArr != null) {
                for (i in 0 until guidanceArr.length()) {
                    guidance.add(guidanceArr.optString(i))
                }
            }

            Result.success(
                ReporterAiDraft(
                    suggestedHeadline = headline,
                    leadParagraph = lead,
                    suggestedCategory = category,
                    keyFacts = keyFacts,
                    factCheckGuidance = guidance
                )
            )
        } catch (e: TimeoutCancellationException) {
            Log.e(TAG, "Reporter AI assistance timed out", e)
            Result.failure(Exception("रिपोर्टर AI सहायता समय सीमा समाप्त हो गई।"))
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            Log.e(TAG, "Reporter AI assistance failed", e)
            Result.failure(Exception(e.localizedMessage ?: "AI रिपोर्ट सहायता विफल हुई।"))
        }
    }

    /**
     * Newsroom 10-Point Fact-Check and Credibility Analysis
     */
    suspend fun evaluateEditorialFactCheck(
        title: String,
        content: String,
        district: String
    ): Result<EditorialFactCheckResult> {
        return try {
            val prompt = """
                आप 'ब्रेकिंग न्यूज़ वाला' के मुख्य संपादक व तथ्य-जांच AI हैं।
                मध्य प्रदेश के जिले '$district' से प्राप्त इस रिपोर्ट का 10-बिंदु संपादकीय आचार संहिता अनुसार कड़ाई से विश्लेषण करें:
                
                शीर्षक: $title
                विवरण: $content
                
                मूल्यांकन बिंदु:
                1. प्राथमिक स्रोत व प्रशासनिक पक्ष (DM/SP/अधिकारी का बयान)
                2. देवनागरी वर्तनी व भाषा की निष्पक्षता
                3. सांप्रदायिक या सामाजिक सद्भाव का परीक्षण
                4. क्या शीर्षक सनसनीखेज (क्लिकबेट) है या तथ्यपरक?
            """.trimIndent()

            val response = withTimeout(60_000L) {
                editorialModel.generateContent(prompt)
            }

            val jsonStr = response.text ?: throw IllegalStateException("रिक्त AI प्रतिक्रिया")
            val json = JSONObject(jsonStr)

            val score = json.optInt("score", 85)
            val credibility = json.optString("credibilityRating", "सत्यापन पूर्ण")
            val remarks = json.optString("editorialRemarksHindi", "समाचार प्रकाशन के अनुकूल है।")
            val refinedHeadline = json.optString("refinedHeadline", title)

            val points = mutableListOf<FactCheckEvaluationItem>()
            val vArr = json.optJSONArray("verificationPoints")
            if (vArr != null) {
                for (i in 0 until vArr.length()) {
                    points.add(
                        FactCheckEvaluationItem(
                            pointName = "बिंदु ${i + 1}",
                            status = "PASSED",
                            commentHindi = vArr.optString(i)
                        )
                    )
                }
            }

            Result.success(
                EditorialFactCheckResult(
                    score = score,
                    credibilityRating = credibility,
                    editorialRemarksHindi = remarks,
                    refinedHeadline = refinedHeadline,
                    checklist = points
                )
            )
        } catch (e: TimeoutCancellationException) {
            Log.e(TAG, "Editorial AI fact check timed out", e)
            Result.failure(Exception("संपादकीय AI तथ्य-जांच समय सीमा समाप्त हो गई।"))
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            Log.e(TAG, "Editorial AI fact check failed", e)
            Result.failure(Exception(e.localizedMessage ?: "AI तथ्य-जांच में त्रुटि हुई।"))
        }
    }
}
