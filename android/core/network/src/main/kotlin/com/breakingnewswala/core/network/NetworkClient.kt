package com.breakingnewswala.core.network

import com.breakingnewswala.core.model.ApiError
import com.breakingnewswala.core.model.ApiResponse
import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Response
import retrofit2.Retrofit
import java.util.concurrent.TimeUnit

object NetworkClient {

    private const val DEFAULT_BASE_URL = "http://10.0.2.2:4000/" // Android emulator host alias

    val json = Json {
        ignoreUnknownKeys = true
        coerceInputValues = true
        encodeDefaults = true
    }

    fun createOkHttpClient(
        tokenProvider: TokenProvider? = null,
        enableLogging: Boolean = false
    ): OkHttpClient {
        val builder = OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(20, TimeUnit.SECONDS)
            .writeTimeout(20, TimeUnit.SECONDS)

        if (tokenProvider != null) {
            builder.addInterceptor(AuthInterceptor(tokenProvider))
            builder.authenticator(TokenAuthenticator(tokenProvider))
        }

        if (enableLogging) {
            val loggingInterceptor = HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            }
            builder.addInterceptor(loggingInterceptor)
        }

        return builder.build()
    }

    fun createRetrofit(
        okHttpClient: OkHttpClient,
        baseUrl: String = DEFAULT_BASE_URL
    ): Retrofit {
        val contentType = "application/json".toMediaType()
        return Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(okHttpClient)
            .addConverterFactory(json.asConverterFactory(contentType))
            .build()
    }

    suspend fun <T : Any> safeApiCall(
        apiCall: suspend () -> Response<ApiResponse<T>>
    ): NetworkResult<T> {
        return try {
            val response = apiCall()
            val body = response.body()
            val data = body?.data
            val err = body?.error

            if (response.isSuccessful && body != null && body.success && data != null) {
                NetworkResult.Success(data)
            } else if (err != null) {
                NetworkResult.Error(
                    code = err.code,
                    message = err.message,
                    statusCode = response.code(),
                    details = err.details
                )
            } else {
                val errorBodyStr = response.errorBody()?.string()
                val parsedError = try {
                    if (!errorBodyStr.isNullOrBlank()) {
                        json.decodeFromString<ApiResponse<JsonElement>>(errorBodyStr).error
                    } else null
                } catch (e: Exception) {
                    null
                }

                val errCode = parsedError?.code ?: "ERR_HTTP_${response.code()}"
                val errMsg = parsedError?.message ?: response.message().ifBlank { "Network error occurred." }
                val errDetails = parsedError?.details

                NetworkResult.Error(
                    code = errCode,
                    message = errMsg,
                    statusCode = response.code(),
                    details = errDetails
                )
            }
        } catch (e: Exception) {
            NetworkResult.Error(
                code = "ERR_CONNECTION_FAILURE",
                message = e.localizedMessage ?: "Unable to connect to server. Please check internet connection."
            )
        }
    }
}
