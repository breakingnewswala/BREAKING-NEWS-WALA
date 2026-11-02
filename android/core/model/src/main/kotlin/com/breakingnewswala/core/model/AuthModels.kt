package com.breakingnewswala.core.model

import kotlinx.serialization.Serializable

@Serializable
data class AuthUser(
    val id: String,
    val phoneNumber: String? = null,
    val email: String? = null,
    val fullName: String,
    val roles: List<String> = emptyList(),
    val status: String = "ACTIVE",
    val phoneVerified: Boolean = false,
    val emailVerified: Boolean = false,
    val mfaEnabled: Boolean = false,
    val homeStateId: String? = null,
    val homeDistrictId: String? = null,
    val createdAt: String? = null
)

@Serializable
data class AuthTokens(
    val accessToken: String,
    val refreshToken: String? = null,
    val expiresInSeconds: Long = 900,
    val tokenType: String = "Bearer"
)

@Serializable
data class AuthResponseData(
    val user: AuthUser,
    val tokens: AuthTokens
)

@Serializable
data class LoginRequest(
    val identifier: String? = null,
    val phoneNumber: String? = null,
    val email: String? = null,
    val password: String,
    val clientType: String = "android"
)

@Serializable
data class RefreshRequest(
    val refreshToken: String,
    val clientType: String = "android"
)

@Serializable
data class RegisterRequest(
    val fullName: String,
    val phoneNumber: String? = null,
    val email: String? = null,
    val password: String,
    val homeDistrictId: String? = null,
    val clientType: String = "android"
)

