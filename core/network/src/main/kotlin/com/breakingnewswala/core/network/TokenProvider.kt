package com.breakingnewswala.core.network

interface TokenProvider {
    fun getAccessToken(): String?
    fun getRefreshToken(): String?
    suspend fun refreshTokens(): Boolean
    fun clearTokens()
}

