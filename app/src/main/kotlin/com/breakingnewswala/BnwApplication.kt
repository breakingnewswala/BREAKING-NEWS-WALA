package com.breakingnewswala

import android.app.Application
import com.breakingnewswala.core.analytics.AnalyticsTracker
import com.breakingnewswala.core.auth.AuthRepository
import com.breakingnewswala.core.auth.TokenManager
import com.breakingnewswala.core.media.MediaUploader
import com.breakingnewswala.core.network.*
import com.breakingnewswala.core.notifications.BnwNotificationManager

class BnwApplication : Application() {

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

    lateinit var epaperApi: EpaperApiService
        private set

    lateinit var monetizationApi: MonetizationApiService
        private set

    lateinit var analyticsTracker: AnalyticsTracker
        private set

    lateinit var mediaUploader: MediaUploader
        private set

    lateinit var notificationManager: BnwNotificationManager
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this

        tokenManager = TokenManager(this)

        val unauthenticatedClient = NetworkClient.createOkHttpClient(tokenProvider = null)
        val retrofit = NetworkClient.createRetrofit(unauthenticatedClient)

        val authApi = retrofit.create(AuthApiService::class.java)
        authRepository = AuthRepository(authApi, tokenManager)

        val authenticatedClient = NetworkClient.createOkHttpClient(tokenProvider = authRepository)
        val authenticatedRetrofit = NetworkClient.createRetrofit(authenticatedClient)

        newsApi = authenticatedRetrofit.create(NewsApiService::class.java)
        territoryApi = authenticatedRetrofit.create(TerritoryApiService::class.java)
        categoryApi = authenticatedRetrofit.create(CategoryApiService::class.java)
        epaperApi = authenticatedRetrofit.create(EpaperApiService::class.java)
        monetizationApi = authenticatedRetrofit.create(MonetizationApiService::class.java)

        val mediaApi = authenticatedRetrofit.create(MediaApiService::class.java)
        mediaUploader = MediaUploader(mediaApi, authenticatedClient)

        val analyticsApi = authenticatedRetrofit.create(AnalyticsApiService::class.java)
        analyticsTracker = AnalyticsTracker(analyticsApi)

        val notificationApi = authenticatedRetrofit.create(NotificationApiService::class.java)
        notificationManager = BnwNotificationManager(this, notificationApi)

        analyticsTracker.trackAppSessionStarted()
    }

    companion object {
        lateinit var instance: BnwApplication
            private set
    }
}
