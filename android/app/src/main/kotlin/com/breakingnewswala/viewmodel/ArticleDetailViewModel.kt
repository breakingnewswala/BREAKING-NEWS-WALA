package com.breakingnewswala.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.breakingnewswala.ai.AiArticleSummary
import com.breakingnewswala.ai.BnwAiService
import com.breakingnewswala.data.model.NewsArticle
import com.breakingnewswala.data.repository.NewsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class ArticleDetailViewModel(
    private val repository: NewsRepository,
    private val aiService: BnwAiService
) : ViewModel() {

    private val _aiSummaryState = MutableStateFlow<UiState<AiArticleSummary>?>(null)
    val aiSummaryState: StateFlow<UiState<AiArticleSummary>?> = _aiSummaryState.asStateFlow()

    private val _fontScale = MutableStateFlow(1.0f)
    val fontScale: StateFlow<Float> = _fontScale.asStateFlow()

    private var lastTrackedArticleId: String? = null

    fun trackViewIfNeeded(article: NewsArticle) {
        if (lastTrackedArticleId == article.id) return
        lastTrackedArticleId = article.id
        viewModelScope.launch {
            repository.incrementArticleViewCount(article)
        }
    }

    fun resetSummary() {
        _aiSummaryState.value = null
    }

    fun generateSummary(article: NewsArticle) {
        viewModelScope.launch {
            _aiSummaryState.value = UiState.Loading
            aiService.generateReaderSummary(
                title = article.title,
                content = article.content.ifBlank { article.summary },
                district = article.district
            ).onSuccess { summary ->
                _aiSummaryState.value = UiState.Success(summary)
            }.onFailure { error ->
                _aiSummaryState.value = UiState.Error(
                    error.localizedMessage ?: "AI सारांश अभी उपलब्ध नहीं है।"
                )
            }
        }
    }

    fun increaseFont() {
        _fontScale.value = (_fontScale.value + 0.1f).coerceAtMost(1.4f)
    }

    fun decreaseFont() {
        _fontScale.value = (_fontScale.value - 0.1f).coerceAtLeast(0.85f)
    }
}
