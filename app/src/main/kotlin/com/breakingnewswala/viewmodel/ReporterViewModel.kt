package com.breakingnewswala.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.breakingnewswala.core.auth.AuthRepository
import com.breakingnewswala.core.model.*
import com.breakingnewswala.core.network.CategoryApiService
import com.breakingnewswala.core.network.NewsApiService
import com.breakingnewswala.core.network.TerritoryApiService
import com.breakingnewswala.data.MockNewsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ReporterUiState(
    val isAuthenticated: Boolean = true, // Logged in as demo reporter by default
    val reporterName: String = "अमित बुंदेला (विशेष संवाददाता)",
    val reporterDistrict: String = "निवाड़ी / भोपाल",
    val reporterRole: String = "DISTRICT_CORRESPONDENT",
    val trustScore: Int = 98,
    val submittedCount: Int = 14,
    val pendingReviewCount: Int = 3,
    val publishedCount: Int = 28,
    val revisionCount: Int = 2,
    val myArticles: List<ArticleItem> = emptyList(),
    val categories: List<CategoryItem> = emptyList(),
    val districts: List<DistrictItem> = emptyList(),
    val isSubmitting: Boolean = false,
    val submissionSuccessMessage: String? = null,
    val feedbackList: List<EditorialFeedbackItem> = emptyList(),
    val selectedArticleFeedback: EditorialFeedbackItem? = null,
    val isAiAssisting: Boolean = false,
    val aiAssistanceError: String? = null,
    val latestAiDraft: com.breakingnewswala.ai.ReporterAiDraft? = null
)

class ReporterViewModel(
    private val authRepository: AuthRepository,
    private val newsApi: NewsApiService,
    private val categoryApi: CategoryApiService,
    private val territoryApi: TerritoryApiService
) : ViewModel() {

    private val _uiState = MutableStateFlow(ReporterUiState())
    val uiState: StateFlow<ReporterUiState> = _uiState.asStateFlow()

    init {
        loadReporterData()
    }

    fun loadReporterData() {
        viewModelScope.launch {
            val categories = MockNewsRepository.categories
            val districts = MockNewsRepository.districts
            val articles = MockNewsRepository.initialArticles.map { MockNewsRepository.toArticleItem(it) }

            val sampleFeedback = listOf(
                EditorialFeedbackItem(
                    id = "fb-1",
                    articleId = "art-1",
                    reviewerName = "सुनील चौबे (मुख्य संपादक)",
                    reviewerRole = "CHIEF_EDITOR",
                    decision = "APPROVED",
                    comments = "तथ्य और समर्थन मूल्य के आंकड़े सत्यापित पाए गए। तुरंत प्रकाशित किया जा रहा है।",
                    createdAt = "2026-11-03 08:00 IST"
                ),
                EditorialFeedbackItem(
                    id = "fb-2",
                    articleId = "art-local-sample",
                    reviewerName = "अभिषेक वर्मा (डेस्क संपादक)",
                    reviewerRole = "DESK_EDITOR",
                    decision = "REVISION_REQUESTED",
                    comments = "कृपया स्थानीय कृषि विभाग के उप-निदेशक का आधिकारिक वक्तव्य संलग्न करें।",
                    createdAt = "2026-11-02 16:30 IST"
                )
            )

            _uiState.value = _uiState.value.copy(
                categories = categories,
                districts = districts,
                myArticles = articles,
                feedbackList = sampleFeedback
            )
        }
    }

    fun submitArticle(
        title: String,
        excerpt: String,
        content: String,
        categoryId: String,
        districtId: String,
        isBreaking: Boolean,
        onSuccess: () -> Unit
    ) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true)

            val draftRequest = CreateDraftRequest(
                title = title,
                content = content,
                summary = excerpt,
                categoryId = categoryId,
                districtId = districtId,
                isBreaking = isBreaking
            )

            // Save in local mock repository immediately
            val createdArticle = MockNewsRepository.addReporterDraft(draftRequest)

            // Update articles list in state
            val updatedList = listOf(MockNewsRepository.toArticleItem(createdArticle)) + _uiState.value.myArticles

            _uiState.value = _uiState.value.copy(
                isSubmitting = false,
                myArticles = updatedList,
                submittedCount = _uiState.value.submittedCount + 1,
                pendingReviewCount = _uiState.value.pendingReviewCount + 1,
                submissionSuccessMessage = "समाचार सफलतापूर्वक संपादकीय डेस्क को समीक्षा हेतु प्रेषित कर दिया गया है।"
            )

            onSuccess()
        }
    }

    fun viewFeedback(articleId: String) {
        val found = _uiState.value.feedbackList.find { it.articleId == articleId }
            ?: _uiState.value.feedbackList.firstOrNull()
        _uiState.value = _uiState.value.copy(selectedArticleFeedback = found)
    }

    fun assistDraftWithAi(rawNotes: String, districtName: String, onComplete: (com.breakingnewswala.ai.ReporterAiDraft) -> Unit) {
        if (rawNotes.isBlank()) {
            _uiState.value = _uiState.value.copy(aiAssistanceError = "कृपया पहले कुछ मुख्य तथ्य या नोट्स दर्ज करें।")
            return
        }
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isAiAssisting = true, aiAssistanceError = null)
            val result = com.breakingnewswala.ai.BnwAiService.assistReporter(rawNotes, districtName)
            result.fold(
                onSuccess = { draft ->
                    _uiState.value = _uiState.value.copy(
                        isAiAssisting = false,
                        latestAiDraft = draft,
                        aiAssistanceError = null
                    )
                    onComplete(draft)
                },
                onFailure = { err ->
                    _uiState.value = _uiState.value.copy(
                        isAiAssisting = false,
                        aiAssistanceError = err.localizedMessage ?: "AI सहायता विफल रही।"
                    )
                }
            )
        }
    }
}
