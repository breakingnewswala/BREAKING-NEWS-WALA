package com.breakingnewswala.reader

import com.breakingnewswala.core.analytics.AnalyticsTracker
import com.breakingnewswala.core.model.ApiResponse
import com.breakingnewswala.core.model.ArticleDetail
import com.breakingnewswala.core.model.ArticleStatus
import com.breakingnewswala.core.network.NewsApiService
import com.breakingnewswala.reader.viewmodel.ArticleDetailViewModel
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import retrofit2.Response

@OptIn(ExperimentalCoroutinesApi::class)
class ArticleDetailViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private lateinit var mockNewsApi: NewsApiService
    private lateinit var mockAnalytics: AnalyticsTracker
    private lateinit var viewModel: ArticleDetailViewModel

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)

        mockNewsApi = mockk(relaxed = true)
        mockAnalytics = mockk(relaxed = true)

        viewModel = ArticleDetailViewModel(mockNewsApi, mockAnalytics)
    }

    @After
    fun teardown() {
        Dispatchers.resetMain()
    }

    @Test
    fun testLoadArticleSuccessEmitsTelemetry() = runTest {
        val article = ArticleDetail(
            id = "art-201",
            slug = "indore-cleanliness-record",
            title = "इंदौर ने स्वच्छता में फिर रचा इतिहास",
            content = "इंदौर शहर ने लगातार सातवीं बार देश के सबसे स्वच्छ शहर का खिताब जीता है।",
            status = ArticleStatus.PUBLISHED,
            authorId = "rep-1",
            authorName = "अमित शर्मा",
            createdAt = "2026-11-01T10:00:00Z"
        )

        coEvery { mockNewsApi.getArticleDetail("art-201") } returns Response.success(
            ApiResponse(success = true, data = article)
        )

        viewModel.loadArticle("art-201")
        testDispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertEquals(false, state.isLoading)
        assertEquals("इंदौर ने स्वच्छता में फिर रचा इतिहास", state.article?.title)

        coVerify(exactly = 1) { mockAnalytics.trackArticleViewed("art-201", any(), any()) }
    }

    @Test
    fun testBookmarkToggling() = runTest {
        val article = ArticleDetail(
            id = "art-202",
            slug = "test-slug",
            title = "परीक्षण समाचार",
            content = "परीक्षण सामग्री",
            status = ArticleStatus.PUBLISHED,
            authorId = "rep-1",
            authorName = "अमित शर्मा",
            createdAt = "2026-11-01T10:00:00Z"
        )
        coEvery { mockNewsApi.getArticleDetail("art-202") } returns Response.success(
            ApiResponse(success = true, data = article)
        )

        viewModel.loadArticle("art-202")
        testDispatcher.scheduler.advanceUntilIdle()

        assertEquals(false, viewModel.uiState.value.isBookmarked)

        viewModel.toggleBookmark()
        assertEquals(true, viewModel.uiState.value.isBookmarked)
        coVerify(exactly = 1) { mockAnalytics.trackContentBookmarked("art-202") }

        viewModel.toggleBookmark()
        assertEquals(false, viewModel.uiState.value.isBookmarked)
    }
}

