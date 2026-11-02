package com.breakingnewswala.reader

import com.breakingnewswala.core.analytics.AnalyticsTracker
import com.breakingnewswala.core.model.*
import com.breakingnewswala.core.network.*
import com.breakingnewswala.reader.viewmodel.HomeViewModel
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import retrofit2.Response

@OptIn(ExperimentalCoroutinesApi::class)
class HomeViewModelTest {

    private val testDispatcher = StandardTestDispatcher()

    private lateinit var mockNewsApi: NewsApiService
    private lateinit var mockCategoryApi: CategoryApiService
    private lateinit var mockTerritoryApi: TerritoryApiService
    private lateinit var mockMonetizationApi: MonetizationApiService
    private lateinit var mockAnalytics: AnalyticsTracker
    private lateinit var viewModel: HomeViewModel

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)

        mockNewsApi = mockk(relaxed = true)
        mockCategoryApi = mockk(relaxed = true)
        mockTerritoryApi = mockk(relaxed = true)
        mockMonetizationApi = mockk(relaxed = true)
        mockAnalytics = mockk(relaxed = true)

        coEvery { mockCategoryApi.getCategories() } returns Response.success(
            ApiResponse(
                success = true,
                data = listOf(
                    CategoryItem(id = "cat-1", slug = "politics", nameEn = "Politics", nameHi = "राजनीति")
                )
            )
        )

        coEvery { mockTerritoryApi.getDistricts(any()) } returns Response.success(
            ApiResponse(
                success = true,
                data = listOf(
                    DistrictItem(id = "dist-1", slug = "bhopal", nameEn = "Bhopal", nameHi = "भोपाल", divisionId = "div-1", stateId = "st-1")
                )
            )
        )

        coEvery { mockNewsApi.getArticles(any(), any(), any(), any(), eq(true), any(), any()) } returns Response.success(
            ApiResponse(
                success = true,
                data = listOf(
                    ArticleItem(id = "art-b1", slug = "breaking-bhopal", title = "भोपाल ब्रेकिंग", isBreaking = true)
                )
            )
        )

        coEvery { mockNewsApi.getArticles(any(), any(), any(), any(), isNull(), any(), any()) } returns Response.success(
            ApiResponse(
                success = true,
                data = listOf(
                    ArticleItem(id = "art-1", slug = "news-1", title = "ताज़ा खबर भोपाल", isBreaking = false)
                )
            )
        )

        coEvery { mockMonetizationApi.serveAd(any()) } returns Response.success(
            ApiResponse(
                success = true,
                data = AdCreative(
                    id = "ad-1",
                    campaignId = "camp-1",
                    placementSlot = "header_leaderboard",
                    creativeUrl = "https://cdn.breakingnewswala.com/ads/header.png",
                    targetUrl = "https://sponsor.com",
                    altTextHi = "विज्ञापन"
                )
            )
        )

        viewModel = HomeViewModel(
            newsApi = mockNewsApi,
            categoryApi = mockCategoryApi,
            territoryApi = mockTerritoryApi,
            monetizationApi = mockMonetizationApi,
            analyticsTracker = mockAnalytics
        )
    }

    @After
    fun teardown() {
        Dispatchers.resetMain()
    }

    @Test
    fun testHomeDataLoadingPopulatesFeedsAndAd() = runTest {
        testDispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertEquals(false, state.isLoading)
        assertEquals(1, state.breakingArticles.size)
        assertEquals("भोपाल ब्रेकिंग", state.breakingArticles.first().title)
        assertEquals(1, state.latestArticles.size)
        assertEquals("ताज़ा खबर भोपाल", state.latestArticles.first().title)
        assertEquals(1, state.categories.size)
        assertEquals(1, state.districts.size)
        assertNotNull(state.activeAd)
        assertEquals("विज्ञापन", state.activeAd?.altTextHi)
    }

    @Test
    fun testSelectCategoryFiltersFeed() = runTest {
        testDispatcher.scheduler.advanceUntilIdle()

        viewModel.selectCategory("cat-1")
        testDispatcher.scheduler.advanceUntilIdle()

        assertEquals("cat-1", viewModel.uiState.value.selectedCategoryId)
    }

    @Test
    fun testSelectDistrictFiltersFeed() = runTest {
        testDispatcher.scheduler.advanceUntilIdle()

        viewModel.selectDistrict("dist-1")
        testDispatcher.scheduler.advanceUntilIdle()

        assertEquals("dist-1", viewModel.uiState.value.selectedDistrictId)
    }
}
