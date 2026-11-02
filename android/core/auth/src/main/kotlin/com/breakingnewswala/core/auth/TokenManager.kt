package com.breakingnewswala.core.auth

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.breakingnewswala.core.model.AuthTokens
import com.breakingnewswala.core.model.AuthUser
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

class TokenManager(private val context: Context) {

    private val json = Json { ignoreUnknownKeys = true; encodeDefaults = true }

    private val prefs: SharedPreferences by lazy {
        try {
            val masterKey = MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()

            EncryptedSharedPreferences.create(
                context,
                PREFS_NAME,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        } catch (e: Exception) {
            // Fallback for JVM unit tests or legacy hardware
            context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        }
    }

    fun saveTokens(tokens: AuthTokens) {
        prefs.edit()
            .putString(KEY_ACCESS_TOKEN, tokens.accessToken)
            .apply {
                if (tokens.refreshToken != null) {
                    putString(KEY_REFRESH_TOKEN, tokens.refreshToken)
                }
                putLong(KEY_EXPIRES_AT, System.currentTimeMillis() + (tokens.expiresInSeconds * 1000))
            }
            .apply()
    }

    fun getAccessToken(): String? = prefs.getString(KEY_ACCESS_TOKEN, null)

    fun getRefreshToken(): String? = prefs.getString(KEY_REFRESH_TOKEN, null)

    fun isAccessTokenExpired(): Boolean {
        val expiresAt = prefs.getLong(KEY_EXPIRES_AT, 0L)
        return System.currentTimeMillis() >= (expiresAt - 60_000) // 1-minute buffer
    }

    fun saveUser(user: AuthUser) {
        val userJson = json.encodeToString(user)
        prefs.edit().putString(KEY_USER_PROFILE, userJson).apply()
    }

    fun getUser(): AuthUser? {
        val userJson = prefs.getString(KEY_USER_PROFILE, null) ?: return null
        return try {
            json.decodeFromString<AuthUser>(userJson)
        } catch (e: Exception) {
            null
        }
    }

    fun isLoggedIn(): Boolean = !getAccessToken().isNullOrBlank()

    fun hasRole(role: String): Boolean {
        val user = getUser() ?: return false
        return user.roles.contains(role)
    }

    fun isReporter(): Boolean = hasRole("REPORTER") || hasRole("BUREAU_CHIEF")

    fun clear() {
        prefs.edit()
            .remove(KEY_ACCESS_TOKEN)
            .remove(KEY_REFRESH_TOKEN)
            .remove(KEY_EXPIRES_AT)
            .remove(KEY_USER_PROFILE)
            .apply()
    }

    companion object {
        private const val PREFS_NAME = "bnw_secure_auth_prefs"
        private const val KEY_ACCESS_TOKEN = "jwt_access_token"
        private const val KEY_REFRESH_TOKEN = "jwt_refresh_token"
        private const val KEY_EXPIRES_AT = "jwt_expires_at"
        private const val KEY_USER_PROFILE = "current_user_profile"
    }
}

