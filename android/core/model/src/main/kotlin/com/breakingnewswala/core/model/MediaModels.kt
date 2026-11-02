package com.breakingnewswala.core.model

import kotlinx.serialization.Serializable

@Serializable
data class PresignedUploadRequest(
    val fileName: String,
    val fileSizeBytes: Long,
    val mimeType: String,
    val assetType: String = "IMAGE",
    val altTextHi: String? = null
)

@Serializable
data class PresignedUploadResponse(
    val assetId: String,
    val uploadUrl: String,
    val storageKey: String,
    val publicUrl: String,
    val headers: Map<String, String> = emptyMap(),
    val expiresInSeconds: Int = 900
)

@Serializable
data class ConfirmUploadRequest(
    val assetId: String,
    val storageKey: String
)

@Serializable
data class MediaAsset(
    val id: String,
    val url: String,
    val thumbnailUrl: String? = null,
    val mimeType: String,
    val fileSizeBytes: Long = 0,
    val assetType: String = "IMAGE",
    val altTextHi: String? = null
)

