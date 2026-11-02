package com.breakingnewswala.core.media

import com.breakingnewswala.core.model.*
import com.breakingnewswala.core.network.MediaApiService
import com.breakingnewswala.core.network.NetworkResult
import io.mockk.*
import kotlinx.coroutines.test.runTest
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.OkHttpClient
import okio.Buffer
import org.junit.Assert.*
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import retrofit2.Response
import java.io.File
import java.io.FileOutputStream
import java.io.RandomAccessFile

class MediaUploaderTest {

    @get:Rule
    val tempFolder = TemporaryFolder()

    private lateinit var mockMediaApi: MediaApiService
    private lateinit var mockOkHttpClient: OkHttpClient
    private lateinit var mockCall: okhttp3.Call
    private lateinit var uploader: MediaUploader

    @Before
    fun setup() {
        mockMediaApi = mockk(relaxed = true)
        mockOkHttpClient = mockk(relaxed = true)
        mockCall = mockk(relaxed = true)

        every { mockOkHttpClient.newCall(any()) } returns mockCall

        uploader = MediaUploader(
            mediaApi = mockMediaApi,
            okHttpClient = mockOkHttpClient
        )
    }

    private fun createSparseTestFile(name: String, sizeBytes: Long): File {
        val file = tempFolder.newFile(name)
        RandomAccessFile(file, "rw").use { it.setLength(sizeBytes) }
        return file
    }

    @Test
    fun testImageSizeLimitRejectionOver10MB() = runTest {
        // 11 MB image exceeds 10 MB limit (DEF-AND-03)
        val file = createSparseTestFile("sample_large.jpg", 11L * 1024 * 1024)

        val result = uploader.uploadFile(file, "image/jpeg")

        assertTrue(result is NetworkResult.Error)
        val error = result as NetworkResult.Error
        assertEquals("ERR_FILE_TOO_LARGE", error.code)
        assertTrue(error.message.contains("10MB"))
        assertTrue(error.message.contains("फ़ोटो"))
        coVerify(exactly = 0) { mockMediaApi.createPresignedUpload(any()) }
    }

    @Test
    fun testVideoSizeLimitAllowsUpTo100MB() = runTest {
        // 60 MB video is within 100 MB limit (DEF-AND-03)
        val file = createSparseTestFile("reel_60mb.mp4", 60L * 1024 * 1024)

        coEvery { mockMediaApi.createPresignedUpload(any()) } returns Response.success(
            ApiResponse(
                success = true,
                data = PresignedUploadResponse(
                    assetId = "ast-vid-1",
                    uploadUrl = "https://storage.breakingnewswala.com/upload/vid1",
                    storageKey = "videos/2026/vid1.mp4",
                    publicUrl = "https://cdn.breakingnewswala.com/videos/vid1.mp4",
                    headers = emptyMap<String, String>()
                )
            )
        )

        val mockResponse = mockk<okhttp3.Response>(relaxed = true) {
            every { isSuccessful } returns true
            every { code } returns 200
        }
        every { mockCall.execute() } returns mockResponse

        coEvery { mockMediaApi.confirmUpload(any()) } returns Response.success(
            ApiResponse(
                success = true,
                data = MediaAsset(
                    id = "ast-vid-1",
                    url = "https://cdn.breakingnewswala.com/videos/vid1.mp4",
                    mimeType = "video/mp4",
                    fileSizeBytes = 60L * 1024 * 1024
                )
            )
        )

        val result = uploader.uploadFile(file, "video/mp4")

        assertTrue(result is NetworkResult.Success)
        val data = (result as NetworkResult.Success).data
        assertEquals("ast-vid-1", data.id)
    }

    @Test
    fun testVideoSizeLimitRejectionOver100MB() = runTest {
        // 105 MB video exceeds 100 MB limit (DEF-AND-03)
        val file = createSparseTestFile("heavy_video.mp4", 105L * 1024 * 1024)

        val result = uploader.uploadFile(file, "video/mp4")

        assertTrue(result is NetworkResult.Error)
        val error = result as NetworkResult.Error
        assertEquals("ERR_FILE_TOO_LARGE", error.code)
        assertTrue(error.message.contains("100MB"))
        assertTrue(error.message.contains("वीडियो"))
    }

    @Test
    fun testAudioSizeLimitRejectionOver25MB() = runTest {
        // 26 MB audio exceeds 25 MB limit (DEF-AND-03)
        val file = createSparseTestFile("voice_dispatch.mp3", 26L * 1024 * 1024)

        val result = uploader.uploadFile(file, "audio/mpeg")

        assertTrue(result is NetworkResult.Error)
        val error = result as NetworkResult.Error
        assertEquals("ERR_FILE_TOO_LARGE", error.code)
        assertTrue(error.message.contains("25MB"))
        assertTrue(error.message.contains("ऑडियो"))
    }

    @Test
    fun testDocumentSizeLimitRejectionOver25MB() = runTest {
        // 27 MB PDF document exceeds 25 MB limit (DEF-AND-03)
        val file = createSparseTestFile("epaper_edition.pdf", 27L * 1024 * 1024)

        val result = uploader.uploadFile(file, "application/pdf")

        assertTrue(result is NetworkResult.Error)
        val error = result as NetworkResult.Error
        assertEquals("ERR_FILE_TOO_LARGE", error.code)
        assertTrue(error.message.contains("25MB"))
        assertTrue(error.message.contains("दस्तावेज़"))
    }

    @Test
    fun testStreamingProgressRequestBodyStreamsChunks() {
        val file = tempFolder.newFile("stream_test.bin")
        val content = ByteArray(32768) { (it % 256).toByte() } // 32 KB test file
        FileOutputStream(file).use { it.write(content) }

        var reportedProgress = 0
        val requestBody = StreamingProgressRequestBody(
            file = file,
            contentType = "application/octet-stream".toMediaTypeOrNull(),
            onProgress = { reportedProgress = it }
        )

        assertEquals(32768L, requestBody.contentLength())
        assertEquals("application/octet-stream", requestBody.contentType()?.toString())

        val sinkBuffer = Buffer()
        requestBody.writeTo(sinkBuffer)

        assertEquals(32768L, sinkBuffer.size)
        assertEquals(100, reportedProgress)
    }
}
