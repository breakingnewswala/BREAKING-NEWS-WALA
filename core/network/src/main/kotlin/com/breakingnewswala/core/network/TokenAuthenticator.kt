package com.breakingnewswala.core.network

import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import okhttp3.Authenticator
import okhttp3.Request
import okhttp3.Response
import okhttp3.Route

class TokenAuthenticator(
    private val tokenProvider: TokenProvider
) : Authenticator {

    private val refreshMutex = Mutex()

    override fun authenticate(route: Route?, response: Response): Request? {
        // Prevent infinite loops if refresh fails
        if (responseCount(response) >= 2) {
            tokenProvider.clearTokens()
            return null
        }

        val currentToken = tokenProvider.getAccessToken()
        val requestToken = response.request.header("Authorization")?.removePrefix("Bearer ")

        val newToken: String? = runBlocking {
            refreshMutex.withLock {
                // If token was already refreshed by another concurrent thread, use it
                val latestToken = tokenProvider.getAccessToken()
                if (latestToken != null && latestToken != requestToken) {
                    latestToken
                } else {
                    val success = tokenProvider.refreshTokens()
                    if (success) tokenProvider.getAccessToken() else null
                }
            }
        }

        return if (!newToken.isNullOrBlank()) {
            response.request.newBuilder()
                .header("Authorization", "Bearer $newToken")
                .build()
        } else {
            tokenProvider.clearTokens()
            null
        }
    }

    private fun responseCount(response: Response): Int {
        var count = 1
        var priorResponse = response.priorResponse
        while (priorResponse != null) {
            count++
            priorResponse = priorResponse.priorResponse
        }
        return count
    }
}

