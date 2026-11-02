package com.breakingnewswala.core.model

import kotlinx.serialization.Serializable

@Serializable
data class AnalyticsEventPayload(
    val eventName: String,
    val sessionId: String,
    val articleId: String? = null,
    val categoryId: String? = null,
    val districtId: String? = null,
    val platform: String = "android",
    val durationSeconds: Int? = null,
    val scrollDepth: Int? = null,
    val searchQuery: String? = null,
    val timestamp: String? = null
)

