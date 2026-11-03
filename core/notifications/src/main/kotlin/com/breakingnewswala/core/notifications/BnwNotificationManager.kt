package com.breakingnewswala.core.notifications

import android.app.NotificationChannel
import android.app.NotificationManager as AndroidNotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import com.breakingnewswala.core.model.RegisterDeviceRequest
import com.breakingnewswala.core.network.NetworkClient
import com.breakingnewswala.core.network.NotificationApiService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class BnwNotificationManager(
    private val context: Context,
    private val notificationApi: NotificationApiService
) {

    init {
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as AndroidNotificationManager

            // 1. Breaking News Channel
            val breakingChannel = NotificationChannel(
                CHANNEL_BREAKING_NEWS,
                "ब्रेकिंग न्यूज़ (Breaking News)",
                AndroidNotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "अत्यंत महत्वपूर्ण और तत्काल ताज़ा खबरें"
                enableLights(true)
                enableVibration(true)
            }

            // 2. District & Regional Alerts
            val districtChannel = NotificationChannel(
                CHANNEL_DISTRICT_ALERTS,
                "ज़िला समाचार अलर्ट (District Alerts)",
                AndroidNotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "आपके चयनित ज़िले और संभाग की स्थानीय खबरें"
            }

            // 3. Reporter Editorial Alerts
            val reporterChannel = NotificationChannel(
                CHANNEL_REPORTER_ALERTS,
                "रिपोर्टर असाइनमेंट व समीक्षा अलर्ट",
                AndroidNotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "संपादकीय टीम द्वारा समाचार समीक्षा एवं संशोधन अनुरोध"
            }

            nm.createNotificationChannels(listOf(breakingChannel, districtChannel, reporterChannel))
        }
    }

    fun registerPushToken(token: String, scope: CoroutineScope) {
        scope.launch(Dispatchers.IO) {
            try {
                val request = RegisterDeviceRequest(
                    token = token,
                    platform = "android",
                    deviceModel = Build.MODEL,
                    appVersion = "1.0.0"
                )
                NetworkClient.safeApiCall { notificationApi.registerDeviceToken(request) }
            } catch (_: Exception) {
                // Ignore failure
            }
        }
    }

    fun showNotification(
        notificationId: Int,
        title: String,
        body: String,
        channelId: String = CHANNEL_BREAKING_NEWS,
        deepLinkUri: String? = null
    ) {
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as AndroidNotificationManager

        val intent = Intent(Intent.ACTION_VIEW).apply {
            if (!deepLinkUri.isNullOrBlank()) {
                data = Uri.parse(deepLinkUri)
            }
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }

        val pendingIntent = PendingIntent.getActivity(
            context,
            notificationId,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val builder = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)

        nm.notify(notificationId, builder.build())
    }

    companion object {
        const val CHANNEL_BREAKING_NEWS = "bnw_breaking_news"
        const val CHANNEL_DISTRICT_ALERTS = "bnw_district_alerts"
        const val CHANNEL_REPORTER_ALERTS = "bnw_reporter_alerts"
    }
}

