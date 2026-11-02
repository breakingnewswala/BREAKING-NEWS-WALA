package com.breakingnewswala.reporter.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.breakingnewswala.core.model.ArticleItem
import com.breakingnewswala.core.model.ArticleStatus
import com.breakingnewswala.core.model.TerritoryBeatAssignment
import com.breakingnewswala.core.network.NetworkClient
import com.breakingnewswala.core.network.NetworkResult
import com.breakingnewswala.core.network.NewsApiService
import com.breakingnewswala.core.network.TerritoryApiService
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ReporterDashboardUiState(
    val isLoading: Boolean = true,
    val assignments: List<TerritoryBeatAssignment> = emptyList(),
    val recentArticles: List<ArticleItem> = emptyList(),
    val draftCount: Int = 0,
    val pendingReviewCount: Int = 0,
    val revisionRequestedCount: Int = 0,
    val publishedCount: Int = 0,
    val rejectedCount: Int = 0,
    val errorMessage: String? = null
)

class ReporterDashboardViewModel(
    private val newsApi: NewsApiService,
    private val territoryApi: TerritoryApiService
) : ViewModel() {

    private val _uiState = MutableStateFlow(ReporterDashboardUiState())
    val uiState: StateFlow<ReporterDashboardUiState> = _uiState.asStateFlow()

    init {
        loadDashboardData()
    }

    fun loadDashboardData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)

            // 1. Load Assigned Territory Beats
            val territoryResult = NetworkClient.safeApiCall { territoryApi.getMyAssignments() }
            val assignments = if (territoryResult is NetworkResult.Success) territoryResult.data else emptyList()

            // 2. Load Reporter Articles Portfolio
            val articlesResult = NetworkClient.safeApiCall { newsApi.getMyArticles(limit = 50) }

            if (articlesResult is NetworkResult.Success) {
                val articles = articlesResult.data
                val drafts = articles.count { it.status == ArticleStatus.DRAFT }
                val pending = articles.count { it.status == ArticleStatus.PENDING_REVIEW || it.status == ArticleStatus.UNDER_REVIEW }
                val revisions = articles.count { it.status == ArticleStatus.REVISION_REQUESTED }
                val published = articles.count { it.status == ArticleStatus.PUBLISHED }
                val rejected = articles.count { it.status == ArticleStatus.REJECTED }

                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    assignments = assignments,
                    recentArticles = articles.take(10),
                    draftCount = drafts,
                    pendingReviewCount = pending,
                    revisionRequestedCount = revisions,
                    publishedCount = published,
                    rejectedCount = rejected,
                    errorMessage = null
                )
            } else if (articlesResult is NetworkResult.Error) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    assignments = assignments,
                    errorMessage = articlesResult.message
                )
            }
        }
    }
}

