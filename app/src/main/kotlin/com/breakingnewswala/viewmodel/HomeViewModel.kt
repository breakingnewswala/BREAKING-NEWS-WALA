package com.breakingnewswala.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.breakingnewswala.core.analytics.AnalyticsTracker
import com.breakingnewswala.core.model.*
import com.breakingnewswala.core.network.*
import com.breakingnewswala.data.MockNewsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class HomeUiState(
    val isLoading: Boolean = false,
    val breakingArticles: List<ArticleItem> = emptyList(),
    val latestArticles: List<ArticleItem> = emptyList(),
    val categories: List<CategoryItem> = emptyList(),
    val districts: List<DistrictItem> = emptyList(),
    val selectedDistrictId: String? = null,
    val selectedCategoryId: String? = null,
    val activeAd: AdCreative? = null,
    val errorMessage: String? = null,
    val userCoins: Int = 125,
    val bookmarkedArticleIds: Set<String> = setOf("art-1")
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

            // 1. Categories
            val catResult = NetworkClient.safeApiCall { categoryApi.getCategories() }
            val categories = if (catResult is NetworkResult.Success && catResult.data.isNotEmpty()) {
                catResult.data
            } else {
                MockNewsRepository.categories
            }

            // 2. Districts (Madhya Pradesh)
            val distResult = NetworkClient.safeApiCall { territoryApi.getDistricts() }
            val districts = if (distResult is NetworkResult.Success && distResult.data.isNotEmpty()) {
                distResult.data
            } else {
                MockNewsRepository.districts
            }

            // 3. Breaking News
            val breakingResult = NetworkClient.safeApiCall {
                newsApi.getArticles(limit = 5, isBreaking = true)
            }
            val breakingArticles = if (breakingResult is NetworkResult.Success && breakingResult.data.isNotEmpty()) {
                breakingResult.data
            } else {
                MockNewsRepository.getAllArticleItems().filter { it.isBreaking }
            }

            // 4. Latest Published Articles
            val latestResult = NetworkClient.safeApiCall {
                newsApi.getArticles(
                    limit = 20,
                    categoryId = _uiState.value.selectedCategoryId,
                    locationId = _uiState.value.selectedDistrictId
                )
            }
            val latestArticles = if (latestResult is NetworkResult.Success && latestResult.data.isNotEmpty()) {
                latestResult.data
            } else {
                filterLocalArticles(_uiState.value.selectedCategoryId, _uiState.value.selectedDistrictId)
            }

            // 5. ASCI Header Ad
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
                errorMessage = null
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

    fun toggleBookmark(articleId: String) {
        val current = _uiState.value.bookmarkedArticleIds.toMutableSet()
        if (current.contains(articleId)) {
            current.remove(articleId)
        } else {
            current.add(articleId)
        }
        _uiState.value = _uiState.value.copy(bookmarkedArticleIds = current)
    }

    fun earnReadingCoins(amount: Int = 5) {
        _uiState.value = _uiState.value.copy(userCoins = _uiState.value.userCoins + amount)
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
            if (result is NetworkResult.Success && result.data.isNotEmpty()) {
                _uiState.value = _uiState.value.copy(latestArticles = result.data, errorMessage = null)
            } else {
                val filtered = filterLocalArticles(_uiState.value.selectedCategoryId, _uiState.value.selectedDistrictId)
                _uiState.value = _uiState.value.copy(latestArticles = filtered, errorMessage = null)
            }
        }
    }

    private fun filterLocalArticles(categoryId: String?, districtId: String?): List<ArticleItem> {
        return MockNewsRepository.getAllArticleItems().filter { item ->
            val matchesCategory = categoryId == null || item.categoryId == categoryId
            val matchesDistrict = districtId == null || item.districtId == districtId
            matchesCategory && matchesDistrict
        }
    }
}
