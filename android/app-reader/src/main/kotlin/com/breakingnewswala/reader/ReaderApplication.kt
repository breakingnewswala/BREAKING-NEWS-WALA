package com.breakingnewswala.reader

import android.app.Application
import com.breakingnewswala.core.analytics.AnalyticsTracker
import com.breakingnewswala.core.auth.AuthRepository
import com.breakingnewswala.core.auth.TokenManager
import com.breakingnewswala.core.network.*
import com.breakingnewswala.core.notifications.BnwNotificationManager

class ReaderApplication : Application() {

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

    lateinit var notificationManager: BnwNotificationManager
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this

        tokenManager = TokenManager(this)

        val okHttpClient = NetworkClient.createOkHttpClient(
            tokenProvider = null // Public reader operates without mandatory auth
        )
        val retrofit = NetworkClient.createRetrofit(okHttpClient)

        newsApi = retrofit.create(NewsApiService::class.java)
        territoryApi = retrofit.create(TerritoryApiService::class.java)
        categoryApi = retrofit.create(CategoryApiService::class.java)
        epaperApi = retrofit.create(EpaperApiService::class.java)
        monetizationApi = retrofit.create(MonetizationApiService::class.java)

        val authApi = retrofit.create(AuthApiService::class.java)
        authRepository = AuthRepository(authApi, tokenManager)

        val analyticsApi = retrofit.create(AnalyticsApiService::class.java)
        analyticsTracker = AnalyticsTracker(analyticsApi)

        val notificationApi = retrofit.create(NotificationApiService::class.java)
        notificationManager = BnwNotificationManager(this, notificationApi)

        analyticsTracker.trackAppSessionStarted()
    }

    companion object {
        lateinit var instance: ReaderApplication
            private set
    }
}

