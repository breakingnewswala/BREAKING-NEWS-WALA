package com.breakingnewswala.core.network

import com.breakingnewswala.core.model.*
import retrofit2.Response
import retrofit2.http.*

interface NewsApiService {
    @GET("api/v1/articles")
    suspend fun getArticles(
        @Query("page") page: Int? = 1,
        @Query("limit") limit: Int? = 20,
        @Query("categoryId") categoryId: String? = null,
        @Query("locationId") locationId: String? = null,
        @Query("isBreaking") isBreaking: Boolean? = null,
        @Query("search") search: String? = null,
        @Query("status") status: String? = "PUBLISHED"
    ): Response<ApiResponse<List<ArticleItem>>>

    @GET("api/v1/articles/{id}")
    suspend fun getArticleDetail(
        @Path("id") articleId: String
    ): Response<ApiResponse<ArticleDetail>>

    // Reporter news routes
    @GET("api/v1/articles/my-articles")
    suspend fun getMyArticles(
        @Query("page") page: Int? = 1,
        @Query("limit") limit: Int? = 20,
        @Query("status") status: String? = null,
        @Query("search") search: String? = null
    ): Response<ApiResponse<List<ArticleItem>>>

    @POST("api/v1/articles/drafts")
    suspend fun createDraft(
        @Body request: CreateDraftRequest
    ): Response<ApiResponse<ArticleDetail>>

    @PATCH("api/v1/articles/drafts/{id}")
    suspend fun updateDraft(
        @Path("id") articleId: String,
        @Body request: UpdateDraftRequest
    ): Response<ApiResponse<ArticleDetail>>

    @GET("api/v1/articles/drafts/{id}")
    suspend fun getDraft(
        @Path("id") articleId: String
    ): Response<ApiResponse<ArticleDetail>>

    @POST("api/v1/articles/{id}/submit")
    suspend fun submitArticle(
        @Path("id") articleId: String
    ): Response<ApiResponse<ArticleDetail>>

    @POST("api/v1/articles/{id}/direct-publish")
    suspend fun directPublish(
        @Path("id") articleId: String
    ): Response<ApiResponse<ArticleDetail>>

    @GET("api/v1/articles/{id}/feedback")
    suspend fun getEditorialFeedback(
        @Path("id") articleId: String
    ): Response<ApiResponse<List<EditorialFeedbackItem>>>

    @GET("api/v1/articles/{id}/revisions")
    suspend fun getArticleRevisions(
        @Path("id") articleId: String
    ): Response<ApiResponse<List<ArticleRevisionItem>>>
}

interface AuthApiService {
    @POST("api/v1/auth/login")
    suspend fun login(
        @Body request: LoginRequest
    ): Response<ApiResponse<AuthResponseData>>

    @POST("api/v1/auth/register")
    suspend fun register(
        @Body request: RegisterRequest
    ): Response<ApiResponse<AuthResponseData>>

    @POST("api/v1/auth/refresh")
    suspend fun refresh(
        @Body request: RefreshRequest
    ): Response<ApiResponse<AuthResponseData>>

    @POST("api/v1/auth/logout")
    suspend fun logout(): Response<ApiResponse<Map<String, String>>>

    @GET("api/v1/auth/me")
    suspend fun getMe(): Response<ApiResponse<AuthUser>>
}

interface TerritoryApiService {
    @GET("api/v1/territory/overview")
    suspend fun getOverview(): Response<ApiResponse<TerritoryOverview>>

    @GET("api/v1/territory/divisions")
    suspend fun getDivisions(): Response<ApiResponse<List<DivisionItem>>>

    @GET("api/v1/territory/districts")
    suspend fun getDistricts(
        @Query("divisionId") divisionId: String? = null
    ): Response<ApiResponse<List<DistrictItem>>>

    @GET("api/v1/territory/my-assignments")
    suspend fun getMyAssignments(): Response<ApiResponse<List<TerritoryBeatAssignment>>>
}

interface CategoryApiService {
    @GET("api/v1/categories")
    suspend fun getCategories(): Response<ApiResponse<List<CategoryItem>>>

    @GET("api/v1/categories/overview")
    suspend fun getCategoryOverview(): Response<ApiResponse<List<CategoryItem>>>
}

interface MediaApiService {
    @POST("api/v1/media/presigned-upload")
    suspend fun createPresignedUpload(
        @Body request: PresignedUploadRequest
    ): Response<ApiResponse<PresignedUploadResponse>>

    @POST("api/v1/media/confirm-upload")
    suspend fun confirmUpload(
        @Body request: ConfirmUploadRequest
    ): Response<ApiResponse<MediaAsset>>
}

interface EpaperApiService {
    @GET("api/v1/epaper/editions")
    suspend fun getEditions(
        @Query("districtId") districtId: String? = null,
        @Query("date") date: String? = null
    ): Response<ApiResponse<List<EpaperEdition>>>

    @GET("api/v1/epaper/latest")
    suspend fun getLatestEdition(
        @Query("districtId") districtId: String? = null
    ): Response<ApiResponse<EpaperEdition>>

    @GET("api/v1/epaper/editions/{id}")
    suspend fun getEditionById(
        @Path("id") editionId: String
    ): Response<ApiResponse<EpaperEdition>>

    @POST("api/v1/epaper/editions/{id}/view")
    suspend fun recordView(
        @Path("id") editionId: String
    ): Response<ApiResponse<Map<String, String>>>

    @POST("api/v1/epaper/editions/{id}/download")
    suspend fun recordDownload(
        @Path("id") editionId: String
    ): Response<ApiResponse<Map<String, String>>>
}

interface NotificationApiService {
    @POST("api/v1/notifications/register-token")
    suspend fun registerDeviceToken(
        @Body request: RegisterDeviceRequest
    ): Response<ApiResponse<Map<String, String>>>

    @GET("api/v1/notifications")
    suspend fun getNotifications(
        @Query("page") page: Int? = 1,
        @Query("limit") limit: Int? = 20
    ): Response<ApiResponse<List<NotificationItem>>>

    @GET("api/v1/notifications/preferences")
    suspend fun getPreferences(): Response<ApiResponse<NotificationPreferences>>

    @PUT("api/v1/notifications/preferences")
    suspend fun updatePreferences(
        @Body preferences: NotificationPreferences
    ): Response<ApiResponse<NotificationPreferences>>
}

interface AnalyticsApiService {
    @POST("api/v1/analytics/events")
    suspend fun trackEvent(
        @Body event: AnalyticsEventPayload
    ): Response<ApiResponse<Map<String, String>>>

    @GET("api/v1/analytics/trending")
    suspend fun getTrending(): Response<ApiResponse<List<ArticleItem>>>
}

interface MonetizationApiService {
    @GET("api/v1/monetization/ads/serve")
    suspend fun serveAd(
        @Query("placementSlot") placementSlot: String
    ): Response<ApiResponse<AdCreative>>

    @POST("api/v1/monetization/ads/impression")
    suspend fun recordImpression(
        @Body payload: Map<String, String>
    ): Response<ApiResponse<Map<String, String>>>

    @POST("api/v1/monetization/ads/click")
    suspend fun recordClick(
        @Body payload: Map<String, String>
    ): Response<ApiResponse<Map<String, String>>>
}

