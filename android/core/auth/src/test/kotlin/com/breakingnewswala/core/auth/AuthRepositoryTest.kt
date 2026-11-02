package com.breakingnewswala.core.auth

import android.content.Context
import android.content.SharedPreferences
import com.breakingnewswala.core.model.*
import com.breakingnewswala.core.network.AuthApiService
import com.breakingnewswala.core.network.NetworkResult
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import retrofit2.Response

class AuthRepositoryTest {

    private lateinit var mockContext: Context
    private lateinit var mockPrefs: SharedPreferences
    private lateinit var mockEditor: SharedPreferences.Editor
    private lateinit var tokenManager: TokenManager
    private lateinit var mockAuthApi: AuthApiService
    private lateinit var authRepository: AuthRepository

    private val storage = mutableMapOf<String, Any?>()

    @Before
    fun setup() {
        mockContext = mockk(relaxed = true)
        mockPrefs = mockk(relaxed = true)
        mockEditor = mockk(relaxed = true)

        every { mockPrefs.getString(any(), any()) } answers {
            val key = firstArg<String>()
            val default = secondArg<String?>()
            storage[key] as? String ?: default
        }
        every { mockPrefs.getLong(any(), any()) } answers {
            val key = firstArg<String>()
            val default = secondArg<Long>()
            storage[key] as? Long ?: default
        }
        every { mockPrefs.edit() } returns mockEditor
        every { mockEditor.putString(any(), any()) } answers {
            val key = firstArg<String>()
            val value = secondArg<String?>()
            storage[key] = value
            mockEditor
        }
        every { mockEditor.putLong(any(), any()) } answers {
            val key = firstArg<String>()
            val value = secondArg<Long>()
            storage[key] = value
            mockEditor
        }
        every { mockEditor.remove(any()) } answers {
            val key = firstArg<String>()
            storage.remove(key)
            mockEditor
        }
        every { mockEditor.clear() } answers {
            storage.clear()
            mockEditor
        }
        every { mockEditor.apply() } returns Unit
        every { mockContext.getSharedPreferences(any(), any()) } returns mockPrefs

        tokenManager = TokenManager(mockContext)
        mockAuthApi = mockk()
        authRepository = AuthRepository(mockAuthApi, tokenManager)
    }

    @Test
    fun testLoginSuccessSavesTokensAndUser() = runTest {
        val user = AuthUser(
            id = "user-123",
            fullName = "राहुल शर्मा",
            roles = listOf("ROLE_REPORTER")
        )
        val tokens = AuthTokens(
            accessToken = "valid-access-token",
            refreshToken = "valid-refresh-token",
            expiresInSeconds = 900
        )
        val authData = AuthResponseData(user = user, tokens = tokens)

        coEvery { mockAuthApi.login(any()) } returns Response.success(
            ApiResponse(success = true, data = authData)
        )

        val result = authRepository.login("reporter@bnw.com", "Secret@123")

        assertTrue(result is NetworkResult.Success)
        assertEquals("user-123", (result as NetworkResult.Success).data.id)
        assertEquals("valid-access-token", authRepository.getAccessToken())
        assertEquals("valid-refresh-token", authRepository.getRefreshToken())
        assertTrue(authRepository.authState.value is AuthState.Authenticated)
    }

    @Test
    fun testRefreshTokensHandlesFailureCleanly() = runTest {
        storage["jwt_refresh_token"] = "expired-refresh-token"

        coEvery { mockAuthApi.refresh(any()) } returns Response.error(
            401,
            """{"success": false, "error": {"code": "ERR_INVALID_TOKEN", "message": "Token expired"}}"""
                .toResponseBody("application/json".toMediaTypeOrNull())
        )

        val success = authRepository.refreshTokens()

        assertEquals(false, success)
        assertEquals(null, authRepository.getAccessToken())
        assertTrue(authRepository.authState.value is AuthState.Unauthenticated)
    }
}
