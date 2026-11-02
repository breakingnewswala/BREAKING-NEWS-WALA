package com.breakingnewswala.reporter

import android.app.Application
import com.breakingnewswala.core.auth.AuthRepository
import com.breakingnewswala.core.auth.TokenManager
import com.breakingnewswala.core.media.MediaUploader
import com.breakingnewswala.core.network.*
import com.breakingnewswala.core.notifications.BnwNotificationManager

class ReporterApplication : Application() {

    lateinit var tokenManager: TokenManager
        private set

    lateinit var authRepository: AuthRepository
        private set

    lateinit var newsApi: NewsApiService
        private set

    lateinit var territoryApi: TerritoryApiService
        private set

    lateinit var categoryApi: CategoryApiService
        private set

    lateinit var mediaApi: MediaApiService
        private set

    lateinit var mediaUploader: MediaUploader
        private set

    lateinit var notificationManager: BnwNotificationManager
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this

        tokenManager = TokenManager(this)

        // Standalone unauthenticated client for login & refresh
        val unauthenticatedClient = NetworkClient.createOkHttpClient(tokenProvider = null)
        val authRetrofit = NetworkClient.createRetrofit(unauthenticatedClient)
        val authApi = authRetrofit.create(AuthApiService::class.java)

        authRepository = AuthRepository(authApi, tokenManager)

        // Authenticated client for all reporter domain requests
        val authenticatedClient = NetworkClient.createOkHttpClient(tokenProvider = authRepository)
        val authenticatedRetrofit = NetworkClient.createRetrofit(authenticatedClient)

        newsApi = authenticatedRetrofit.create(NewsApiService::class.java)
        territoryApi = authenticatedRetrofit.create(TerritoryApiService::class.java)
        categoryApi = authenticatedRetrofit.create(CategoryApiService::class.java)
        mediaApi = authenticatedRetrofit.create(MediaApiService::class.java)

        mediaUploader = MediaUploader(mediaApi, authenticatedClient)

        val notificationApi = authenticatedRetrofit.create(NotificationApiService::class.java)
        notificationManager = BnwNotificationManager(this, notificationApi)
    }

    companion object {
        lateinit var instance: ReporterApplication
            private set
    }
}

