package com.breakingnewswala.core.auth

import android.content.SharedPreferences
import com.breakingnewswala.core.model.*
import com.breakingnewswala.core.network.AuthApiService
import com.breakingnewswala.core.network.NetworkResult
import kotlinx.coroutines.test.runTest
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import retrofit2.Response

class AuthRepositoryTest {

    private class FakeEditor(private val storage: MutableMap<String, Any?>) : SharedPreferences.Editor {
        override fun putString(key: String?, value: String?): SharedPreferences.Editor {
            if (key != null) storage[key] = value
            return this
        }
        override fun putStringSet(key: String?, values: MutableSet<String>?): SharedPreferences.Editor = this
        override fun putInt(key: String?, value: Int): SharedPreferences.Editor = this
        override fun putLong(key: String?, value: Long): SharedPreferences.Editor {
            if (key != null) storage[key] = value
            return this
        }
        override fun putFloat(key: String?, value: Float): SharedPreferences.Editor = this
        override fun putBoolean(key: String?, value: Boolean): SharedPreferences.Editor = this
        override fun remove(key: String?): SharedPreferences.Editor {
            if (key != null) storage.remove(key)
            return this
        }
        override fun clear(): SharedPreferences.Editor {
            storage.clear()
            return this
        }
        override fun commit(): Boolean = true
        override fun apply() {}
    }

    private class FakeSharedPreferences(private val storage: MutableMap<String, Any?>) : SharedPreferences {
        override fun getAll(): MutableMap<String, *> = storage
        override fun getString(key: String?, defValue: String?): String? = storage[key] as? String ?: defValue
        override fun getStringSet(key: String?, defValues: MutableSet<String>?): MutableSet<String>? = null
        override fun getInt(key: String?, defValue: Int): Int = defValue
        override fun getLong(key: String?, defValue: Long): Long = storage[key] as? Long ?: defValue
        override fun getFloat(key: String?, defValue: Float): Float = defValue
        override fun getBoolean(key: String?, defValue: Boolean): Boolean = defValue
        override fun contains(key: String?): Boolean = storage.containsKey(key)
        override fun edit(): SharedPreferences.Editor = FakeEditor(storage)
        override fun registerOnSharedPreferenceChangeListener(listener: SharedPreferences.OnSharedPreferenceChangeListener?) {}
        override fun unregisterOnSharedPreferenceChangeListener(listener: SharedPreferences.OnSharedPreferenceChangeListener?) {}
    }

    private class FakeAuthApiService : AuthApiService {
        var loginResponse: Response<ApiResponse<AuthResponseData>>? = null
        var refreshResponse: Response<ApiResponse<AuthResponseData>>? = null

        override suspend fun login(request: LoginRequest): Response<ApiResponse<AuthResponseData>> {
            return loginResponse ?: Response.error(
                400,
                """{"success":false,"error":{"code":"ERR_UNKNOWN","message":"Failed"}}""".toResponseBody("application/json".toMediaTypeOrNull())
            )
        }

        override suspend fun register(request: RegisterRequest): Response<ApiResponse<AuthResponseData>> {
            return Response.error(400, "".toResponseBody(null))
        }

        override suspend fun refresh(request: RefreshRequest): Response<ApiResponse<AuthResponseData>> {
            return refreshResponse ?: Response.error(
                401,
                """{"success":false,"error":{"code":"ERR_INVALID_TOKEN","message":"Token expired"}}""".toResponseBody("application/json".toMediaTypeOrNull())
            )
        }

        override suspend fun logout(): Response<ApiResponse<Map<String, String>>> {
            return Response.success(ApiResponse(success = true, data = mapOf("status" to "logged_out")))
        }

        override suspend fun getMe(): Response<ApiResponse<AuthUser>> {
            return Response.error(400, "".toResponseBody(null))
        }
    }

    private val storage = mutableMapOf<String, Any?>()
    private lateinit var fakePrefs: FakeSharedPreferences
    private lateinit var tokenManager: TokenManager
    private lateinit var fakeAuthApi: FakeAuthApiService
    private lateinit var authRepository: AuthRepository

    @Before
    fun setup() {
        storage.clear()
        fakePrefs = FakeSharedPreferences(storage)
        tokenManager = TokenManager(customPrefs = fakePrefs)
        fakeAuthApi = FakeAuthApiService()
        authRepository = AuthRepository(fakeAuthApi, tokenManager)
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
        fakeAuthApi.loginResponse = Response.success(
            ApiResponse(success = true, data = AuthResponseData(user = user, tokens = tokens))
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
        fakeAuthApi.refreshResponse = Response.error(
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
