package com.breakingnewswala.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.breakingnewswala.core.analytics.AnalyticsTracker
import com.breakingnewswala.core.model.ArticleDetail
import com.breakingnewswala.core.network.NetworkClient
import com.breakingnewswala.core.network.NetworkResult
import com.breakingnewswala.core.network.NewsApiService
import com.breakingnewswala.data.MockNewsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ArticleDetailUiState(
    val isLoading: Boolean = false,
    val article: ArticleDetail? = null,
    val isBookmarked: Boolean = false,
    val fontScale: Float = 1.0f, // 0.85f (Small), 1.0f (Medium), 1.25f (Large)
    val errorMessage: String? = null,
    val isGeneratingAiSummary: Boolean = false,
    val aiSummary: String? = null,
    val aiSummaryError: String? = null
)

class ArticleDetailViewModel(
    private val newsApi: NewsApiService,
    private val analyticsTracker: AnalyticsTracker
) : ViewModel() {

    private val _uiState = MutableStateFlow(ArticleDetailUiState())
    val uiState: StateFlow<ArticleDetailUiState> = _uiState.asStateFlow()

    fun loadArticle(articleId: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)

            val result = NetworkClient.safeApiCall { newsApi.getArticleDetail(articleId) }

            if (result is NetworkResult.Success && result.data != null) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    article = result.data,
                    errorMessage = null
                )
                analyticsTracker.trackArticleViewed(result.data.id, result.data.categoryId, result.data.districtId)
            } else {
                // Fallback to local mock repository
                val localArticle = MockNewsRepository.getArticleById(articleId)
                if (localArticle != null) {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        article = localArticle,
                        errorMessage = null
                    )
                    analyticsTracker.trackArticleViewed(localArticle.id, localArticle.categoryId, localArticle.districtId)
                } else {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = "समाचार लोड नहीं किया जा सका।"
                    )
                }
            }
        }
    }

    fun toggleBookmark() {
        val next = !_uiState.value.isBookmarked
        _uiState.value = _uiState.value.copy(isBookmarked = next)
        _uiState.value.article?.let {
            if (next) analyticsTracker.trackContentBookmarked(it.id)
        }
    }

    fun changeFontScale(scale: Float) {
        _uiState.value = _uiState.value.copy(fontScale = scale)
    }

    fun shareArticle() {
        _uiState.value.article?.let {
            analyticsTracker.trackArticleShared(it.id)
        }
    }

    fun generateAiSummary() {
        val currentArticle = _uiState.value.article ?: return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(
                isGeneratingAiSummary = true,
                aiSummaryError = null
            )

            val result = com.breakingnewswala.ai.BnwAiService.generateReaderSummary(
                title = currentArticle.title,
                content = currentArticle.content
            )

            result.fold(
                onSuccess = { summaryText ->
                    _uiState.value = _uiState.value.copy(
                        isGeneratingAiSummary = false,
                        aiSummary = summaryText,
                        aiSummaryError = null
                    )
                },
                onFailure = { err ->
                    _uiState.value = _uiState.value.copy(
                        isGeneratingAiSummary = false,
                        aiSummaryError = err.localizedMessage ?: "AI सारांश उत्पन्न नहीं हो सका।"
                    )
                }
            )
        }
    }
}
