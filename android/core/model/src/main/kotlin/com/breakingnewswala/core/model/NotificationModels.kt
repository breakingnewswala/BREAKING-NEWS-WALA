package com.breakingnewswala.core.model

import kotlinx.serialization.Serializable

@Serializable
data class NotificationItem(
    val id: String,
    val title: String,
    val body: String,
    val type: String = "NEWS_ALERT",
    val articleId: String? = null,
    val isRead: Boolean = false,
    val createdAt: String
)

@Serializable
data class RegisterDeviceRequest(
    val token: String,
    val platform: String = "android",
    val deviceModel: String? = null,
    val appVersion: String? = null
)

@Serializable
data class NotificationPreferences(
    val breakingNews: Boolean = true,
    val districtAlerts: Boolean = true,
    val dailyDigest: Boolean = false,
    val quietHoursEnabled: Boolean = false
)

