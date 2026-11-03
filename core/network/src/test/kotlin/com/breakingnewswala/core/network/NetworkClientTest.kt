package com.breakingnewswala.core.network

import com.breakingnewswala.core.model.ArticleDetail
import com.breakingnewswala.core.model.ArticleStatus
import com.breakingnewswala.core.model.AuthTokens
import kotlinx.coroutines.test.runTest
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class NetworkClientTest {

    private lateinit var mockWebServer: MockWebServer
    private lateinit var mockTokenProvider: TokenProvider

    @Before
    fun setup() {
        mockWebServer = MockWebServer()
        mockWebServer.start()

        mockTokenProvider = object : TokenProvider {
            override fun getAccessToken(): String = "test-access-token"
            override fun getRefreshToken(): String = "test-refresh-token"
            override suspend fun refreshTokens(): Boolean = true
            override fun clearTokens() {}
        }
    }

    @After
    fun teardown() {
        mockWebServer.shutdown()
    }

    @Test
    fun testAuthInterceptorAddsAuthorizationHeader() {
        val client = OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor(mockTokenProvider))
            .build()

        mockWebServer.enqueue(MockResponse().setBody("""{"success": true}"""))

        val request = Request.Builder()
            .url(mockWebServer.url("/api/v1/test"))
            .build()

        val response = client.newCall(request).execute()
        val recordedRequest = mockWebServer.takeRequest()

        assertEquals("Bearer test-access-token", recordedRequest.getHeader("Authorization"))
        assertTrue(recordedRequest.getHeader("User-Agent")?.startsWith("BNW-Android") == true)
    }

    @Test
    fun testSafeApiCallSuccess() = runTest {
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody("""
                    {
                        "success": true,
                        "data": {
                            "id": "1",
                            "slug": "test",
                            "title": "टेस्ट शीर्षक",
                            "content": "सामग्री",
                            "status": "PUBLISHED",
                            "authorId": "author-123",
                            "authorName": "विशेष संवाददाता",
                            "createdAt": "2026-11-02T10:00:00Z"
                        }
                    }
                """.trimIndent())
        )

        val retrofit = NetworkClient.createRetrofit(
            NetworkClient.createOkHttpClient(),
            mockWebServer.url("/").toString()
        )
        val api = retrofit.create(NewsApiService::class.java)

        val result = NetworkClient.safeApiCall { api.getArticleDetail("1") }

        assertTrue(result is NetworkResult.Success)
        val article = (result as NetworkResult.Success).data
        assertEquals("टेस्ट शीर्षक", article.title)
        assertEquals(ArticleStatus.PUBLISHED, article.status)
    }

    @Test
    fun testSafeApiCallErrorHandling() = runTest {
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(403)
                .setHeader("Content-Type", "application/json")
                .setBody("""
                    {
                        "success": false,
                        "error": {
                            "code": "ERR_ROLE_PENDING_APPROVAL",
                            "message": "Chief Editor role remains pending approval."
                        }
                    }
                """.trimIndent())
        )

        val retrofit = NetworkClient.createRetrofit(
            NetworkClient.createOkHttpClient(),
            mockWebServer.url("/").toString()
        )
        val api = retrofit.create(NewsApiService::class.java)

        val result = NetworkClient.safeApiCall { api.getArticleDetail("1") }

        assertTrue(result is NetworkResult.Error)
        val error = result as NetworkResult.Error
        assertEquals("ERR_ROLE_PENDING_APPROVAL", error.code)
        assertEquals(403, error.statusCode)
    }
}
