package com.breakingnewswala.reader.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.breakingnewswala.core.analytics.AnalyticsTracker
import com.breakingnewswala.core.model.ArticleDetail
import com.breakingnewswala.core.network.NetworkClient
import com.breakingnewswala.core.network.NetworkResult
import com.breakingnewswala.core.network.NewsApiService
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ArticleDetailUiState(
    val isLoading: Boolean = true,
    val article: ArticleDetail? = null,
    val isBookmarked: Boolean = false,
    val errorMessage: String? = null
)

class ArticleDetailViewModel(
    private val newsApi: NewsApiService,
    private val analyticsTracker: AnalyticsTracker
) : ViewModel() {

    private val _uiState = MutableStateFlow(ArticleDetailUiState())
    val uiState: StateFlow<ArticleDetailUiState> = _uiState.asStateFlow()

    private var heartbeatStarted = false

    fun loadArticle(articleId: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            val result = NetworkClient.safeApiCall { newsApi.getArticleDetail(articleId) }

            when (result) {
                is NetworkResult.Success -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        article = result.data
                    )
                    analyticsTracker.trackArticleViewed(
                        articleId = result.data.id,
                        categoryId = result.data.categoryId,
                        districtId = result.data.districtId
                    )
                    start30sHeartbeat(result.data.id)
                }
                is NetworkResult.Error -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = result.message
                    )
                }
                NetworkResult.Loading -> {}
            }
        }
    }

    private fun start30sHeartbeat(articleId: String) {
        if (heartbeatStarted) return
        heartbeatStarted = true
        viewModelScope.launch {
            delay(30_000)
            analyticsTracker.trackArticleRead30s(articleId)
        }
    }

    fun shareArticle() {
        val article = _uiState.value.article ?: return
        analyticsTracker.trackArticleShared(article.id)
    }

    fun toggleBookmark() {
        val article = _uiState.value.article ?: return
        val newState = !_uiState.value.isBookmarked
        _uiState.value = _uiState.value.copy(isBookmarked = newState)
        if (newState) {
            analyticsTracker.trackContentBookmarked(article.id)
        }
    }
}

