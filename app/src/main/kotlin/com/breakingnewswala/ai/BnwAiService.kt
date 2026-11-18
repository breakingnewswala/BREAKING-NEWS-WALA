package com.breakingnewswala.ai

import com.google.firebase.Firebase
import com.google.firebase.ai.ai
import com.google.firebase.ai.type.Schema
import com.google.firebase.ai.type.generationConfig
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.withTimeout
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

@Serializable
data class AiArticleSummary(
    val headline: String = "",
    val bulletPoints: List<String> = emptyList(),
    val readTimeSeconds: Int = 30
)

@Serializable
data class AiReporterDraft(
    val polishedHeadline: String = "",
    val leadSummary: String = "",
    val bodyText: String = "",
    val suggestedCategory: String = "राष्ट्रीय",
    val editorialTip: String = ""
)

@Serializable
data class AiFactCheckReport(
    val scoreOutOf100: Int = 80,
    val verdict: String = "समीक्षा योग्य",
    val verifiedSignals: List<String> = emptyList(),
    val cautionFlags: List<String> = emptyList(),
    val editorNoteHi: String = ""
)

class BnwAiService {

    private val json = Json { ignoreUnknownKeys = true }

    private val summaryModel by lazy {
        Firebase.ai.generativeModel(
            modelName = "gemini-3.8-flash",
            generationConfig = generationConfig {
                responseMimeType = "application/json"
                responseSchema = Schema.obj(
                    mapOf(
                        "headline" to Schema.string("Short crisp Hindi headline"),
                        "bulletPoints" to Schema.array(
                            Schema.string("Key takeaway bullet in Hindi")
                        ),
                        "readTimeSeconds" to Schema.integer("Estimated read time in seconds")
                    )
                )
            }
        )
    }

    private val draftModel by lazy {
        Firebase.ai.generativeModel(
            modelName = "gemini-3.8-flash",
            generationConfig = generationConfig {
                responseMimeType = "application/json"
                responseSchema = Schema.obj(
                    mapOf(
                        "polishedHeadline" to Schema.string("Crisp journalistic Hindi headline"),
                        "leadSummary" to Schema.string("Two-line Hindi news summary"),
                        "bodyText" to Schema.string("Well-structured neutral Hindi news report"),
                        "suggestedCategory" to Schema.string("One of राष्ट्रीय, राजनीति, विकास, रोजगार, अपराध, खेल, तकनीक, स्थानीय"),
                        "editorialTip" to Schema.string("Short 10-point compliance suggestion in Hindi")
                    )
                )
            }
        )
    }

    private val factCheckModel by lazy {
        Firebase.ai.generativeModel(
            modelName = "gemini-3.8-flash",
            generationConfig = generationConfig {
                responseMimeType = "application/json"
                responseSchema = Schema.obj(
                    mapOf(
                        "scoreOutOf100" to Schema.integer("Editorial quality & verification readiness score 0-100"),
                        "verdict" to Schema.string("Short verdict in Hindi"),
                        "verifiedSignals" to Schema.array(
                            Schema.string("Positive journalistic signal in Hindi")
                        ),
                        "cautionFlags" to Schema.array(
                            Schema.string("Potential risk or missing fact in Hindi")
                        ),
                        "editorNoteHi" to Schema.string("Concise editor remark in Hindi")
                    )
                )
            }
        )
    }

    suspend fun generateReaderSummary(
        title: String,
        content: String,
        district: String
    ): Result<AiArticleSummary> = try {
        val prompt = """
            आप 'ब्रेकिंग न्यूज़ वाला' (Breaking News Wala) के वरिष्ठ हिंदी समाचार संपादक हैं।
            नीचे दिए गए समाचार का सटीक, निष्पक्ष और तेज़ 3-पॉइंट हिंदी सारांश तैयार करें।
            किसी भी ऐसी बात को न जोड़ें जो मूल लेख में नहीं है।

            जिला/क्षेत्र: $district
            शीर्षक: $title
            समाचार:
            $content
        """.trimIndent()

        val rawText = withTimeout(60_000L) {
            summaryModel.generateContent(prompt).text
        } ?: return Result.failure(IllegalStateException("AI से उत्तर प्राप्त नहीं हुआ।"))

        Result.success(json.decodeFromString<AiArticleSummary>(rawText))
    } catch (e: CancellationException) {
        throw e
    } catch (e: Exception) {
        Result.failure(e)
    }

    suspend fun assistReporter(
        roughNotes: String,
        district: String
    ): Result<AiReporterDraft> = try {
        val prompt = """
            आप एक अनुभवी हिंदी न्यूज़ डेस्क असिस्टेंट हैं।
            फील्ड रिपोर्टर के कच्चे नोट्स को मानक पत्रकारिता शैली (स्पष्ट देवनागरी हिंदी, निष्पक्ष भाषा, बिना सनसनीखेज दावे) में ढालें।

            जिला: $district
            रिपोर्टर के नोट्स:
            $roughNotes
        """.trimIndent()

        val rawText = withTimeout(60_000L) {
            draftModel.generateContent(prompt).text
        } ?: return Result.failure(IllegalStateException("AI ड्राफ्ट तैयार नहीं हो सका।"))

        Result.success(json.decodeFromString<AiReporterDraft>(rawText))
    } catch (e: CancellationException) {
        throw e
    } catch (e: Exception) {
        Result.failure(e)
    }

    suspend fun evaluateEditorialFactCheck(
        title: String,
        content: String,
        district: String
    ): Result<AiFactCheckReport> = try {
        val prompt = """
            आप 10-पॉइंट न्यूज़ रूम फैक्ट-चेक ऑडिटर हैं।
            इस समाचार सबमिशन की जांच करें कि क्या इसमें स्थान, संदर्भ, तटस्थ भाषा और तथ्यात्मक स्पष्टता पर्याप्त है।
            यदि कोई संदिग्ध दावा या अधूरा संदर्भ हो तो cautionFlags में बताएं।

            जिला: $district
            शीर्षक: $title
            विवरण:
            $content
        """.trimIndent()

        val rawText = withTimeout(60_000L) {
            factCheckModel.generateContent(prompt).text
        } ?: return Result.failure(IllegalStateException("फैक्ट-चेक रिपोर्ट तैयार नहीं हो सकी।"))

        Result.success(json.decodeFromString<AiFactCheckReport>(rawText))
    } catch (e: CancellationException) {
        throw e
    } catch (e: Exception) {
        Result.failure(e)
    }
}
