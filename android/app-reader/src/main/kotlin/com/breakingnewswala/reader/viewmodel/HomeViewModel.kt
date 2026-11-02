package com.breakingnewswala.reader.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.breakingnewswala.core.analytics.AnalyticsTracker
import com.breakingnewswala.core.model.*
import com.breakingnewswala.core.network.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class HomeUiState(
    val isLoading: Boolean = true,
    val breakingArticles: List<ArticleItem> = emptyList(),
    val latestArticles: List<ArticleItem> = emptyList(),
    val categories: List<CategoryItem> = emptyList(),
    val districts: List<DistrictItem> = emptyList(),
    val selectedDistrictId: String? = null,
    val selectedCategoryId: String? = null,
    val activeAd: AdCreative? = null,
    val errorMessage: String? = null
)

class HomeViewModel(
    private val newsApi: NewsApiService,
    private val categoryApi: CategoryApiService,
    private val territoryApi: TerritoryApiService,
    private val monetizationApi: MonetizationApiService,
    private val analyticsTracker: AnalyticsTracker
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        loadHomeData()
    }

    fun loadHomeData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)

            // 1. Load Categories
            val catResult = NetworkClient.safeApiCall { categoryApi.getCategories() }
            val categories = if (catResult is NetworkResult.Success) catResult.data else emptyList()

            // 2. Load Districts (Madhya Pradesh)
            val distResult = NetworkClient.safeApiCall { territoryApi.getDistricts() }
            val districts = if (distResult is NetworkResult.Success) distResult.data else emptyList()

            // 3. Load Breaking News
            val breakingResult = NetworkClient.safeApiCall {
                newsApi.getArticles(limit = 5, isBreaking = true)
            }
            val breakingArticles = if (breakingResult is NetworkResult.Success) breakingResult.data else emptyList()

            // 4. Load Latest Published News Feed
            val latestResult = NetworkClient.safeApiCall {
                newsApi.getArticles(
                    limit = 20,
                    categoryId = _uiState.value.selectedCategoryId,
                    locationId = _uiState.value.selectedDistrictId
                )
            }
            val latestArticles = if (latestResult is NetworkResult.Success) latestResult.data else emptyList()

            // 5. Load ASCI Ad Banner (Header slot)
            val adResult = NetworkClient.safeApiCall {
                monetizationApi.serveAd(AdPlacementSlot.header_leaderboard.name)
            }
            val activeAd = if (adResult is NetworkResult.Success) adResult.data else null

            _uiState.value = _uiState.value.copy(
                isLoading = false,
                breakingArticles = breakingArticles,
                latestArticles = latestArticles,
                categories = categories,
                districts = districts,
                activeAd = activeAd,
                errorMessage = if (latestResult is NetworkResult.Error) latestResult.message else null
            )
        }
    }

    fun selectCategory(categoryId: String?) {
        val newCat = if (_uiState.value.selectedCategoryId == categoryId) null else categoryId
        _uiState.value = _uiState.value.copy(selectedCategoryId = newCat)
        if (newCat != null) analyticsTracker.trackCategoryBrowsed(newCat)
        loadArticlesForCurrentFilters()
    }

    fun selectDistrict(districtId: String?) {
        val newDist = if (_uiState.value.selectedDistrictId == districtId) null else districtId
        _uiState.value = _uiState.value.copy(selectedDistrictId = newDist)
        if (newDist != null) analyticsTracker.trackDistrictBrowsed(newDist)
        loadArticlesForCurrentFilters()
    }

    private fun loadArticlesForCurrentFilters() {
        viewModelScope.launch {
            val result = NetworkClient.safeApiCall {
                newsApi.getArticles(
                    limit = 20,
                    categoryId = _uiState.value.selectedCategoryId,
                    locationId = _uiState.value.selectedDistrictId
                )
            }
            if (result is NetworkResult.Success) {
                _uiState.value = _uiState.value.copy(latestArticles = result.data, errorMessage = null)
            } else if (result is NetworkResult.Error) {
                _uiState.value = _uiState.value.copy(errorMessage = result.message)
            }
        }
    }
}

