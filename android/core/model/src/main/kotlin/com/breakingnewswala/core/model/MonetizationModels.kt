package com.breakingnewswala.core.model

import kotlinx.serialization.Serializable

@Serializable
enum class AdPlacementSlot {
    header_leaderboard,
    homepage_infeed,
    article_body_mpu,
    sidebar_sticky,
    district_top,
    sticky_bottom_banner,
    video_postroll
}

@Serializable
data class AdCreative(
    val id: String,
    val campaignId: String,
    val placementSlot: String,
    val creativeUrl: String,
    val targetUrl: String,
    val altTextHi: String = "विज्ञापन",
    val isSponsored: Boolean = false,
    val advertiserName: String? = null
)

