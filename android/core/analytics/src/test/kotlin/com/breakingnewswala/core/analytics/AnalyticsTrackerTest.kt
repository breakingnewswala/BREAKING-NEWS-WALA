package com.breakingnewswala.core.analytics

import com.breakingnewswala.core.model.AnalyticsEventPayload
import com.breakingnewswala.core.model.ApiResponse
import com.breakingnewswala.core.network.AnalyticsApiService
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import io.mockk.slot
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

    private lateinit var mockAnalyticsApi: AnalyticsApiService
    private lateinit var tracker: AnalyticsTracker
    private val testDispatcher = UnconfinedTestDispatcher()
    private val testScope = TestScope(testDispatcher)

    @Before
    fun setup() {
        mockAnalyticsApi = mockk()
        coEvery { mockAnalyticsApi.trackEvent(any()) } returns Response.success(
            ApiResponse(success = true, data = mapOf("status" to "recorded"))
        )

        tracker = AnalyticsTracker(mockAnalyticsApi, testScope)
    }

    @Test
    fun testTrackArticleViewedEmitsValidCanonicalPayload() = runTest {
        val slot = slot<AnalyticsEventPayload>()
        coEvery { mockAnalyticsApi.trackEvent(capture(slot)) } returns Response.success(
            ApiResponse(success = true, data = mapOf("status" to "recorded"))
        )

        tracker.trackArticleViewed(
            articleId = "art-101",
            categoryId = "cat-politics",
            districtId = "dist-bhopal"
        )

        coVerify(exactly = 1) { mockAnalyticsApi.trackEvent(any()) }

        val captured = slot.captured
        assertEquals("article_viewed", captured.eventName)
        assertEquals("art-101", captured.articleId)
        assertEquals("cat-politics", captured.categoryId)
        assertEquals("dist-bhopal", captured.districtId)
        assertEquals("android", captured.platform)
        assertNotNull(captured.sessionId)
    }

    @Test
    fun testTrackArticleRead30sEmitsCorrectDuration() = runTest {
        val slot = slot<AnalyticsEventPayload>()
        coEvery { mockAnalyticsApi.trackEvent(capture(slot)) } returns Response.success(
            ApiResponse(success = true, data = mapOf("status" to "recorded"))
        )

        tracker.trackArticleRead30s("art-102", scrollDepth = 75)

        val captured = slot.captured
        assertEquals("article_read_30s", captured.eventName)
        assertEquals("art-102", captured.articleId)
        assertEquals(30, captured.durationSeconds)
        assertEquals(75, captured.scrollDepth)
    }
}

