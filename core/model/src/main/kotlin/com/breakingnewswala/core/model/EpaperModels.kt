package com.breakingnewswala.core.model

import kotlinx.serialization.Serializable

@Serializable
enum class EpaperStatus {
    DRAFT,
    PROCESSING,
    PENDING_REVIEW,
    APPROVED,
    SCHEDULED,
    PUBLISHED,
    ARCHIVED
}

@Serializable
data class EpaperEdition(
    val id: String,
    val title: String,
    val editionDate: String,
    val districtId: String? = null,
    val districtName: String? = null,
    val pdfUrl: String,
    val totalPages: Int = 1,
    val thumbnailUrl: String? = null,
    val status: EpaperStatus = EpaperStatus.PUBLISHED,
    val pages: List<EpaperPage> = emptyList(),
    val publishedAt: String? = null
)

@Serializable
data class EpaperPage(
    val id: String,
    val editionId: String,
    val pageNumber: Int,
    val pageImageUrl: String,
    val thumbnailUrl: String? = null
)

