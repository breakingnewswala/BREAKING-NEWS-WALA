package com.breakingnewswala.core.auth

import com.breakingnewswala.core.model.*
import com.breakingnewswala.core.network.AuthApiService
import com.breakingnewswala.core.network.NetworkClient
import com.breakingnewswala.core.network.NetworkResult
import com.breakingnewswala.core.network.TokenProvider
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

sealed class AuthState {
    data object Unauthenticated : AuthState()
    data object Loading : AuthState()
    data class Authenticated(val user: AuthUser) : AuthState()
    data class Error(val message: String) : AuthState()
}

class AuthRepository(
    private val authApi: AuthApiService,
    private val tokenManager: TokenManager
) : TokenProvider {

    private val _authState = MutableStateFlow<AuthState>(
        tokenManager.getUser()?.let { AuthState.Authenticated(it) } ?: AuthState.Unauthenticated
    )
    val authState: StateFlow<AuthState> = _authState.asStateFlow()

    private val _currentUser = MutableStateFlow<AuthUser?>(tokenManager.getUser())
    val currentUser: StateFlow<AuthUser?> = _currentUser.asStateFlow()

    override fun getAccessToken(): String? = tokenManager.getAccessToken()

    override fun getRefreshToken(): String? = tokenManager.getRefreshToken()

    override fun clearTokens() {
        tokenManager.clear()
        _currentUser.value = null
        _authState.value = AuthState.Unauthenticated
    }

    override suspend fun refreshTokens(): Boolean {
        val refreshToken = getRefreshToken() ?: return false
        val result = NetworkClient.safeApiCall {
            authApi.refresh(RefreshRequest(refreshToken = refreshToken))
        }

        return when (result) {
            is NetworkResult.Success -> {
                tokenManager.saveTokens(result.data.tokens)
                tokenManager.saveUser(result.data.user)
                _currentUser.value = result.data.user
                _authState.value = AuthState.Authenticated(result.data.user)
                true
            }
            is NetworkResult.Error -> {
                clearTokens()
                false
            }
            NetworkResult.Loading -> false
        }
    }

    suspend fun login(identifier: String, password: String): NetworkResult<AuthUser> {
        _authState.value = AuthState.Loading

        val isEmail = identifier.contains("@")
        val request = LoginRequest(
            identifier = identifier,
            email = if (isEmail) identifier else null,
            phoneNumber = if (!isEmail) identifier else null,
            password = password
        )

        val result = NetworkClient.safeApiCall { authApi.login(request) }
        return when (result) {
            is NetworkResult.Success -> {
                val data = result.data
                tokenManager.saveTokens(data.tokens)
                tokenManager.saveUser(data.user)
                _currentUser.value = data.user
                _authState.value = AuthState.Authenticated(data.user)
                NetworkResult.Success(data.user)
            }
            is NetworkResult.Error -> {
                _authState.value = AuthState.Error(result.message)
                result
            }
            NetworkResult.Loading -> NetworkResult.Loading
        }
    }

    suspend fun register(
        fullName: String,
        phoneNumber: String?,
        email: String?,
        password: String,
        homeDistrictId: String?
    ): NetworkResult<AuthUser> {
        _authState.value = AuthState.Loading

        val request = RegisterRequest(
            fullName = fullName,
            phoneNumber = phoneNumber,
            email = email,
            password = password,
            homeDistrictId = homeDistrictId
        )

        val result = NetworkClient.safeApiCall { authApi.register(request) }
        return when (result) {
            is NetworkResult.Success -> {
                val data = result.data
                tokenManager.saveTokens(data.tokens)
                tokenManager.saveUser(data.user)
                _currentUser.value = data.user
                _authState.value = AuthState.Authenticated(data.user)
                NetworkResult.Success(data.user)
            }
            is NetworkResult.Error -> {
                _authState.value = AuthState.Error(result.message)
                result
            }
            NetworkResult.Loading -> NetworkResult.Loading
        }
    }

    suspend fun logout(): NetworkResult<Unit> {
        try {
            NetworkClient.safeApiCall { authApi.logout() }
        } catch (_: Exception) {
            // Ignore network failures on logout; clear local session regardless
        }
        clearTokens()
        return NetworkResult.Success(Unit)
    }

    suspend fun checkSession(): NetworkResult<AuthUser> {
        if (!tokenManager.isLoggedIn()) {
            clearTokens()
            return NetworkResult.Error("ERR_UNAUTHENTICATED", "User is not logged in.")
        }

        if (tokenManager.isAccessTokenExpired()) {
            val refreshed = refreshTokens()
            if (!refreshed) {
                return NetworkResult.Error("ERR_SESSION_EXPIRED", "Session has expired.")
            }
        }

        val result = NetworkClient.safeApiCall { authApi.getMe() }
        return when (result) {
            is NetworkResult.Success -> {
                tokenManager.saveUser(result.data)
                _currentUser.value = result.data
                _authState.value = AuthState.Authenticated(result.data)
                NetworkResult.Success(result.data)
            }
            is NetworkResult.Error -> {
                if (result.statusCode == 401) {
                    clearTokens()
                }
                result
            }
            NetworkResult.Loading -> NetworkResult.Loading
        }
    }
}

