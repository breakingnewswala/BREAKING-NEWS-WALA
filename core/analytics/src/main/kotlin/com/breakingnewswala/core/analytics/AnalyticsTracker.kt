package com.breakingnewswala.core.analytics

import com.breakingnewswala.core.model.AnalyticsEventPayload
import com.breakingnewswala.core.network.AnalyticsApiService
import com.breakingnewswala.core.network.NetworkClient
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import java.util.UUID

class AnalyticsTracker(
    private val analyticsApi: AnalyticsApiService,
    private val scope: CoroutineScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
) {

    val sessionId: String = UUID.randomUUID().toString()

    fun trackAppSessionStarted() {
        sendEvent("app_session_started")
    }

    fun trackAppSessionEnded(durationSeconds: Int) {
        sendEvent("app_session_ended", durationSeconds = durationSeconds)
    }

    fun trackArticleViewed(articleId: String, categoryId: String? = null, districtId: String? = null) {
        sendEvent(
            eventName = "article_viewed",
            articleId = articleId,
            categoryId = categoryId,
            districtId = districtId
        )
    }

    fun trackArticleRead30s(articleId: String, scrollDepth: Int? = null) {
        sendEvent(
            eventName = "article_read_30s",
            articleId = articleId,
            durationSeconds = 30,
            scrollDepth = scrollDepth
        )
    }

    fun trackArticleShared(articleId: String) {
        sendEvent("article_shared", articleId = articleId)
    }

    fun trackCategoryBrowsed(categoryId: String) {
        sendEvent("category_browsed", categoryId = categoryId)
    }

    fun trackDistrictBrowsed(districtId: String) {
        sendEvent("district_browsed", districtId = districtId)
    }

    fun trackSearchPerformed(query: String) {
        sendEvent("search_performed", searchQuery = query)
    }

    fun trackEpaperOpened(editionId: String, districtId: String? = null) {
        sendEvent("epaper_opened", articleId = editionId, districtId = districtId)
    }

    fun trackEpaperPageViewed(editionId: String, pageNumber: Int) {
        sendEvent("epaper_page_viewed", articleId = editionId, scrollDepth = pageNumber)
    }

    fun trackEpaperDownloaded(editionId: String) {
        sendEvent("epaper_downloaded", articleId = editionId)
    }

    fun trackContentBookmarked(articleId: String) {
        sendEvent("content_bookmarked", articleId = articleId)
    }

    private fun sendEvent(
        eventName: String,
        articleId: String? = null,
        categoryId: String? = null,
        districtId: String? = null,
        durationSeconds: Int? = null,
        scrollDepth: Int? = null,
        searchQuery: String? = null
    ) {
        val payload = AnalyticsEventPayload(
            eventName = eventName,
            sessionId = sessionId,
            articleId = articleId,
            categoryId = categoryId,
            districtId = districtId,
            platform = "android",
            durationSeconds = durationSeconds,
            scrollDepth = scrollDepth,
            searchQuery = searchQuery,
            timestamp = java.time.Instant.now().toString()
        )

        scope.launch {
            try {
                NetworkClient.safeApiCall { analyticsApi.trackEvent(payload) }
            } catch (_: Exception) {
                // Silently swallow analytics failures; analytics must never crash the app
            }
        }
    }
}

