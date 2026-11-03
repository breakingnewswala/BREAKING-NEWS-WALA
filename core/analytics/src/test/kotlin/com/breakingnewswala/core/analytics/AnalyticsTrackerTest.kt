package com.breakingnewswala.core.analytics

import com.breakingnewswala.core.model.AnalyticsEventPayload
import com.breakingnewswala.core.model.ApiResponse
import com.breakingnewswala.core.model.ArticleItem
import com.breakingnewswala.core.network.AnalyticsApiService
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Before
import org.junit.Test
import retrofit2.Response

@OptIn(ExperimentalCoroutinesApi::class)
class AnalyticsTrackerTest {

    private class FakeAnalyticsApiService : AnalyticsApiService {
        val capturedEvents = mutableListOf<AnalyticsEventPayload>()

        override suspend fun trackEvent(event: AnalyticsEventPayload): Response<ApiResponse<Map<String, String>>> {
            capturedEvents.add(event)
            return Response.success(ApiResponse(success = true, data = mapOf("status" to "recorded")))
        }

        override suspend fun getTrending(): Response<ApiResponse<List<ArticleItem>>> {
            return Response.success(ApiResponse(success = true, data = emptyList()))
        }
    }

    private lateinit var fakeAnalyticsApi: FakeAnalyticsApiService
    private lateinit var tracker: AnalyticsTracker
    private val testDispatcher = UnconfinedTestDispatcher()
    private val testScope = TestScope(testDispatcher)

    @Before
    fun setup() {
        fakeAnalyticsApi = FakeAnalyticsApiService()
        tracker = AnalyticsTracker(fakeAnalyticsApi, testScope)
    }

    @Test
    fun testTrackArticleViewedEmitsValidCanonicalPayload() = runTest {
        tracker.trackArticleViewed(
            articleId = "art-101",
            categoryId = "cat-politics",
            districtId = "dist-bhopal"
        )

        assertEquals(1, fakeAnalyticsApi.capturedEvents.size)

        val captured = fakeAnalyticsApi.capturedEvents.first()
        assertEquals("article_viewed", captured.eventName)
        assertEquals("art-101", captured.articleId)
        assertEquals("cat-politics", captured.categoryId)
        assertEquals("dist-bhopal", captured.districtId)
        assertEquals("android", captured.platform)
        assertNotNull(captured.sessionId)
    }

    @Test
    fun testTrackArticleRead30sEmitsCorrectDuration() = runTest {
        tracker.trackArticleRead30s("art-102", scrollDepth = 75)

        assertEquals(1, fakeAnalyticsApi.capturedEvents.size)

        val captured = fakeAnalyticsApi.capturedEvents.first()
        assertEquals("article_read_30s", captured.eventName)
        assertEquals("art-102", captured.articleId)
        assertEquals(30, captured.durationSeconds)
        assertEquals(75, captured.scrollDepth)
    }
}

