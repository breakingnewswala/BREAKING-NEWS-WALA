package com.breakingnewswala.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.breakingnewswala.core.analytics.AnalyticsTracker
import com.breakingnewswala.core.model.ArticleItem
import com.breakingnewswala.core.network.NetworkClient
import com.breakingnewswala.core.network.NetworkResult
import com.breakingnewswala.core.network.NewsApiService
import com.breakingnewswala.data.MockNewsRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class SearchUiState(
    val query: String = "",
    val isLoading: Boolean = false,
    val results: List<ArticleItem> = emptyList(),
    val trendingSearches: List<String> = listOf("भोपाल", "इंदौर बायो-सीएनजी", "उज्जैन मंडी भाव", "ओरछा", "रीवा सोलर प्लांट", "गेहूं पंजीयन")
)

class SearchViewModel(
    private val newsApi: NewsApiService,
    private val analyticsTracker: AnalyticsTracker
) : ViewModel() {

    private val _uiState = MutableStateFlow(SearchUiState())
    val uiState: StateFlow<SearchUiState> = _uiState.asStateFlow()

    private var searchJob: Job? = null

    fun onQueryChange(newQuery: String) {
        _uiState.value = _uiState.value.copy(query = newQuery)

        searchJob?.cancel()
        if (newQuery.trim().length >= 2) {
            searchJob = viewModelScope.launch {
                delay(300) // Debounce
                performSearch(newQuery.trim())
            }
        } else {
            _uiState.value = _uiState.value.copy(results = emptyList(), isLoading = false)
        }
    }

    private suspend fun performSearch(query: String) {
        _uiState.value = _uiState.value.copy(isLoading = true)

        val result = NetworkClient.safeApiCall { newsApi.getArticles(search = query, limit = 20) }

        if (result is NetworkResult.Success && result.data.isNotEmpty()) {
            _uiState.value = _uiState.value.copy(isLoading = false, results = result.data)
            analyticsTracker.trackSearchPerformed(query)
        } else {
            // Local fallback filter
            val filtered = MockNewsRepository.getAllArticleItems().filter { item ->
                item.title.contains(query, ignoreCase = true) ||
                (item.summary?.contains(query, ignoreCase = true) == true) ||
                (item.content?.contains(query, ignoreCase = true) == true) ||
                (item.districtName?.contains(query, ignoreCase = true) == true) ||
                (item.categoryName?.contains(query, ignoreCase = true) == true)
            }
            _uiState.value = _uiState.value.copy(isLoading = false, results = filtered)
            analyticsTracker.trackSearchPerformed(query)
        }
    }
}
