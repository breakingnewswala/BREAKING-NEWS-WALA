package com.breakingnewswala.core.media

import com.breakingnewswala.core.model.*
import com.breakingnewswala.core.network.MediaApiService
import com.breakingnewswala.core.network.NetworkClient
import com.breakingnewswala.core.network.NetworkResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import okio.BufferedSink
import okio.source
import java.io.File
import java.io.IOException

/**
 * Approved Maximum File Size Limits and MIME Mapping
 * Grounded in docs/16-Storage.md §9.1 and packages/backend/src/modules/media/media.constants.ts
 * Resolves DEF-AND-03
 */
object MediaConstants {
    const val MAX_IMAGE_SIZE_BYTES = 10L * 1024 * 1024      // 10 MB maximum for high-res field imagery
    const val MAX_VIDEO_SIZE_BYTES = 100L * 1024 * 1024     // 100 MB maximum for mobile video reels & field rushes
    const val MAX_AUDIO_SIZE_BYTES = 25L * 1024 * 1024      // 25 MB maximum for voiceover recordings and dispatches
    const val MAX_DOCUMENT_SIZE_BYTES = 25L * 1024 * 1024   // 25 MB maximum for regional e-paper PDF editions
    const val MAX_FALLBACK_SIZE_BYTES = 10L * 1024 * 1024   // 10 MB fallback for unclassified types

    fun resolveAssetType(mimeType: String): String = when {
        mimeType.startsWith("image/", ignoreCase = true) -> "image"
        mimeType.startsWith("video/", ignoreCase = true) -> "video"
        mimeType.startsWith("audio/", ignoreCase = true) -> "audio"
        mimeType.equals("application/pdf", ignoreCase = true) || mimeType.contains("document", ignoreCase = true) -> "document"
        else -> "image" // Safe default fallback
    }

    fun getMaxSizeForMimeType(mimeType: String): Long = when (resolveAssetType(mimeType)) {
        "image" -> MAX_IMAGE_SIZE_BYTES
        "video" -> MAX_VIDEO_SIZE_BYTES
        "audio" -> MAX_AUDIO_SIZE_BYTES
        "document" -> MAX_DOCUMENT_SIZE_BYTES
        else -> MAX_FALLBACK_SIZE_BYTES
    }

    fun getTypeNameHindi(assetType: String): String = when (assetType) {
        "image" -> "फ़ोटो"
        "video" -> "वीडियो"
        "audio" -> "ऑडियो"
        "document" -> "दस्तावेज़"
        else -> "फ़ाइल"
    }
}

/**
 * Streaming RequestBody that writes file contents directly to Okio BufferedSink in chunks
 * without loading the entire file into memory (eliminates OOM risk - DEF-AND-04),
 * while calculating and dispatching live upload progress updates.
 */
class StreamingProgressRequestBody(
    private val file: File,
    private val contentType: MediaType?,
    private val onProgress: ((Int) -> Unit)? = null
) : RequestBody() {

    override fun contentType(): MediaType? = contentType

    override fun contentLength(): Long = file.length()

    @Throws(IOException::class)
    override fun writeTo(sink: BufferedSink) {
        val totalLength = file.length()
        file.source().use { source ->
            val buffer = okio.Buffer()
            var uploaded = 0L
            var readCount: Long
            val chunkSize = 8192L // 8 KB streaming chunks to prevent memory spikes
            var lastEmittedProgress = -1

            while (source.read(buffer, chunkSize).also { readCount = it } != -1L) {
                sink.write(buffer, readCount)
                sink.flush()
                uploaded += readCount

                if (totalLength > 0) {
                    val progress = ((uploaded.toDouble() / totalLength) * 100).toInt().coerceIn(0, 100)
                    if (progress != lastEmittedProgress) {
                        lastEmittedProgress = progress
                        onProgress?.invoke(progress)
                    }
                }
            }
        }
    }
}

class MediaUploader(
    private val mediaApi: MediaApiService,
    private val okHttpClient: OkHttpClient = OkHttpClient()
) {

    suspend fun uploadFile(
        file: File,
        mimeType: String,
        altTextHi: String? = null,
        onProgress: ((Int) -> Unit)? = null
    ): NetworkResult<MediaAsset> = withContext(Dispatchers.IO) {
        // 1. Client-Side Size Ceiling Validation by Asset Type (DEF-AND-03)
        val assetType = MediaConstants.resolveAssetType(mimeType)
        val maxSizeBytes = MediaConstants.getMaxSizeForMimeType(mimeType)
        val maxMb = maxSizeBytes / (1024 * 1024)
        val typeNameHi = MediaConstants.getTypeNameHindi(assetType)

        if (file.length() > maxSizeBytes) {
            return@withContext NetworkResult.Error(
                code = "ERR_FILE_TOO_LARGE",
                message = "${typeNameHi} का आकार ${maxMb}MB से कम होना चाहिए।"
            )
        }

        // 2. Request Presigned Upload URL
        onProgress?.invoke(5)
        val presignedResult = NetworkClient.safeApiCall {
            mediaApi.createPresignedUpload(
                PresignedUploadRequest(
                    fileName = file.name,
                    fileSizeBytes = file.length(),
                    mimeType = mimeType,
                    assetType = assetType.uppercase(),
                    altTextHi = altTextHi
                )
            )
        }

        if (presignedResult !is NetworkResult.Success) {
            return@withContext presignedResult as NetworkResult.Error
        }

        val presignedData = presignedResult.data
        onProgress?.invoke(15)

        // 3. Direct Binary PUT Streaming Upload to Storage (S3 / R2 / MinIO) (DEF-AND-04)
        try {
            val streamingBody = StreamingProgressRequestBody(
                file = file,
                contentType = mimeType.toMediaTypeOrNull(),
                onProgress = { fileProgress ->
                    // Scale file streaming progress (0..100) to overall upload phase (15..85)
                    val scaledProgress = 15 + (fileProgress * 0.70).toInt()
                    onProgress?.invoke(scaledProgress)
                }
            )

            val requestBuilder = Request.Builder()
                .url(presignedData.uploadUrl)
                .put(streamingBody)

            presignedData.headers.forEach { (k, v) ->
                requestBuilder.header(k, v)
            }

            val uploadResponse = okHttpClient.newCall(requestBuilder.build()).execute()
            if (!uploadResponse.isSuccessful) {
                return@withContext NetworkResult.Error(
                    code = "ERR_STORAGE_UPLOAD_FAILED",
                    message = "स्टोरेज में अपलोड विफल रहा (${uploadResponse.code}).",
                    statusCode = uploadResponse.code
                )
            }
        } catch (e: Exception) {
            return@withContext NetworkResult.Error(
                code = "ERR_UPLOAD_NETWORK_ERROR",
                message = "फ़ाइल अपलोड के दौरान नेटवर्क त्रुटि: ${e.localizedMessage}"
            )
        }

        onProgress?.invoke(90)

        // 4. Confirm Upload with Central Backend
        val confirmResult = NetworkClient.safeApiCall {
            mediaApi.confirmUpload(
                ConfirmUploadRequest(
                    assetId = presignedData.assetId,
                    storageKey = presignedData.storageKey
                )
            )
        }

        if (confirmResult is NetworkResult.Success) {
            onProgress?.invoke(100)
        }
        return@withContext confirmResult
    }
}
