package com.breakingnewswala.reporter.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.breakingnewswala.core.model.ArticleItem
import com.breakingnewswala.core.model.ArticleStatus
import com.breakingnewswala.core.model.EditorialFeedbackItem
import com.breakingnewswala.core.network.NetworkClient
import com.breakingnewswala.core.network.NetworkResult
import com.breakingnewswala.core.network.NewsApiService
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ArticleHistoryUiState(
    val isLoading: Boolean = true,
    val articles: List<ArticleItem> = emptyList(),
    val selectedStatus: ArticleStatus? = null,
    val selectedFeedback: List<EditorialFeedbackItem> = emptyList(),
    val errorMessage: String? = null
)

class ArticleHistoryViewModel(
    private val newsApi: NewsApiService
) : ViewModel() {

    private val _uiState = MutableStateFlow(ArticleHistoryUiState())
    val uiState: StateFlow<ArticleHistoryUiState> = _uiState.asStateFlow()

    init {
        loadArticles()
    }

    fun loadArticles(status: ArticleStatus? = null) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(
                isLoading = true,
                selectedStatus = status,
                errorMessage = null
            )

            val result = NetworkClient.safeApiCall {
                newsApi.getMyArticles(
                    status = status?.name,
                    limit = 50
                )
            }

            when (result) {
                is NetworkResult.Success -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        articles = result.data
                    )
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

    fun loadFeedback(articleId: String) {
        viewModelScope.launch {
            val result = NetworkClient.safeApiCall { newsApi.getEditorialFeedback(articleId) }
            if (result is NetworkResult.Success) {
                _uiState.value = _uiState.value.copy(selectedFeedback = result.data)
            }
        }
    }
}

