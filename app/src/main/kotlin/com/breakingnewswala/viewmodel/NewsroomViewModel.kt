package com.breakingnewswala.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.breakingnewswala.core.model.ArticleDetail
import com.breakingnewswala.core.model.ArticleStatus
import com.breakingnewswala.data.MockNewsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class FactCheckPoint(
    val id: Int,
    val titleHindi: String,
    val descriptionHindi: String,
    var isChecked: Boolean = false
)

data class NewsroomUiState(
    val queueArticles: List<ArticleDetail> = emptyList(),
    val selectedArticle: ArticleDetail? = null,
    val factCheckPoints: List<FactCheckPoint> = emptyList(),
    val aiSuggestedHeadline: String? = null,
    val aiAnalysisNotes: String? = null,
    val isAiProcessing: Boolean = false,
    val actionSuccessMessage: String? = null
)

class NewsroomViewModel : ViewModel() {

    private val _uiState = MutableStateFlow(NewsroomUiState())
    val uiState: StateFlow<NewsroomUiState> = _uiState.asStateFlow()

    init {
        loadQueue()
    }

    fun loadQueue() {
        val pendingArticles = MockNewsRepository.initialArticles.filter {
            it.status == ArticleStatus.PENDING_REVIEW || it.status == ArticleStatus.UNDER_REVIEW
        }

        // If queue is empty in mock, treat the first article or create a pending draft
        val queue = if (pendingArticles.isNotEmpty()) {
            pendingArticles
        } else {
            listOf(
                ArticleDetail(
                    id = "queue-1",
                    slug = "sehore-water-irrigation-scheme-inauguration",
                    title = "सीहोर: पार्वती नदी पर 120 करोड़ की मध्यम सिंचाई परियोजना को मिली मंजूरी, 45 गांवों को मिलेगा सिंचाई का पानी",
                    summary = "जल संसाधन विभाग ने जारी किया टेंडर। क्षेत्रीय विधायक व किसानों ने जताई खुशी।",
                    content = "सीहोर। जिले के किसानों की लंबे समय से चली आ रही सिंचाई जल की मांग अब पूरी होने जा रही है। पार्वती नदी कछार में मध्यम सिंचाई परियोजना के निर्माण को तकनीकी व प्रशासनिक स्वीकृति मिल गई है। इससे लगभग 18,000 हेक्टेयर कृषि भूमि सिंचित हो सकेगी।",
                    status = ArticleStatus.PENDING_REVIEW,
                    featuredImage = "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80",
                    categoryId = "cat-agri",
                    categoryName = "कृषि एवं मंडी भाव",
                    districtId = "dist-sehore",
                    districtName = "सीहोर",
                    authorId = "rep-108",
                    authorName = "महेश मेवाड़ा",
                    authorRole = "तहसील संवाददाता (सीहोर)",
                    isBreaking = false,
                    publishedAt = null,
                    createdAt = "2026-11-03 11:30 IST"
                )
            )
        }

        _uiState.value = _uiState.value.copy(
            queueArticles = queue,
            selectedArticle = queue.firstOrNull(),
            factCheckPoints = defaultFactCheckList()
        )
    }

    private fun defaultFactCheckList(): List<FactCheckPoint> {
        return listOf(
            FactCheckPoint(1, "प्राथमिक स्रोत का सत्यापन", "क्या सूचना अधिकृत अधिकारी या प्रत्यक्षदर्शी से प्राप्त हुई है?", false),
            FactCheckPoint(2, "ऑडियो/वीडियो फॉरेंसिक जांच", "क्या फोटो या वीडियो पुराने या डीपफेक तो नहीं हैं?", false),
            FactCheckPoint(3, "स्थान व टाइमस्टैम्प मिलान", "क्या घटना की तारीख, समय और जिला मध्य प्रदेश के क्षेत्राधिकार में है?", false),
            FactCheckPoint(4, "प्रशासनिक पक्ष संलग्न", "क्या संबंधित कलेक्टर, एसपी या सक्षम अधिकारी का बयान शामिल है?", false),
            FactCheckPoint(5, "सांप्रदायिक व सामाजिक सद्भाव", "क्या समाचार किसी वर्ग या समुदाय के प्रति द्वेष तो नहीं फैलाता?", false),
            FactCheckPoint(6, "मानहानि व विधिक जोखिम", "क्या तथ्य न्यायालयीन अवमानना या मानहानि के दायरे से बाहर हैं?", false),
            FactCheckPoint(7, "पीड़ित पक्ष की निजता संरक्षण", "क्या पोक्सो (POCSO) व जुवेनाइल कानूनों का शत-प्रतिशत पालन है?", false),
            FactCheckPoint(8, "देवनागरी वर्तनी व मात्रा शुद्धता", "क्या शीर्षक और भाषा व्याकरण के अनुसार शुद्ध है?", false),
            FactCheckPoint(9, "कॉपीराइट व बौद्धिक संपदा", "क्या उपयोग की गई तस्वीरें और फुटेज हमारे नेटवर्क के अधिकृत हैं?", false),
            FactCheckPoint(10, "डेस्क व मुख्य संपादक अनुमति", "क्या डेस्क प्रभारी द्वारा अंतिम प्रकाशन का अनुमोदन प्राप्त है?", false)
        )
    }

    fun selectArticle(article: ArticleDetail) {
        _uiState.value = _uiState.value.copy(
            selectedArticle = article,
            factCheckPoints = defaultFactCheckList(),
            aiSuggestedHeadline = null,
            aiAnalysisNotes = null,
            actionSuccessMessage = null
        )
    }

    fun toggleFactCheckPoint(pointId: Int) {
        val updated = _uiState.value.factCheckPoints.map {
            if (it.id == pointId) it.copy(isChecked = !it.isChecked) else it
        }
        _uiState.value = _uiState.value.copy(factCheckPoints = updated)
    }

    fun runAiAnalysis() {
        val article = _uiState.value.selectedArticle ?: return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isAiProcessing = true, actionSuccessMessage = null)

            val result = com.breakingnewswala.ai.BnwAiService.evaluateEditorialFactCheck(
                title = article.title,
                content = article.content,
                district = article.districtName ?: "मध्य प्रदेश"
            )

            result.fold(
                onSuccess = { analysis ->
                    val notesBuilder = StringBuilder()
                    notesBuilder.append("• विश्वसनीयता स्तर: ${analysis.credibilityRating} (स्कोर: ${analysis.score}/100)\n")
                    notesBuilder.append("• संपादकीय टिप्पणी: ${analysis.editorialRemarksHindi}\n")
                    if (analysis.checklist.isNotEmpty()) {
                        notesBuilder.append("• प्रमुख बिंदु: ${analysis.checklist.joinToString(" | ") { it.commentHindi }}")
                    }

                    _uiState.value = _uiState.value.copy(
                        isAiProcessing = false,
                        aiSuggestedHeadline = analysis.refinedHeadline,
                        aiAnalysisNotes = notesBuilder.toString()
                    )
                },
                onFailure = { err ->
                    _uiState.value = _uiState.value.copy(
                        isAiProcessing = false,
                        aiAnalysisNotes = "⚠️ Gemini Flash तथ्य-जांच विफल: ${err.localizedMessage ?: "अज्ञात त्रुटि"}"
                    )
                }
            )
        }
    }

    fun approveAndPublish(articleId: String, onDone: () -> Unit) {
        val found = MockNewsRepository.initialArticles.find { it.id == articleId }
        val updatedQueue = _uiState.value.queueArticles.filter { it.id != articleId }

        _uiState.value = _uiState.value.copy(
            queueArticles = updatedQueue,
            selectedArticle = updatedQueue.firstOrNull(),
            actionSuccessMessage = "समाचार को 10-बिंदु सत्यापन उपरांत मुख्य पोर्टल पर लाइव प्रकाशित कर दिया गया है!"
        )
        onDone()
    }

    fun requestRevision(articleId: String, note: String, onDone: () -> Unit) {
        val updatedQueue = _uiState.value.queueArticles.filter { it.id != articleId }
        _uiState.value = _uiState.value.copy(
            queueArticles = updatedQueue,
            selectedArticle = updatedQueue.firstOrNull(),
            actionSuccessMessage = "संवाददाता को संशोधन निर्देश प्रेषित किए गए।"
        )
        onDone()
    }
}
