package com.breakingnewswala.core.model

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

@Serializable
data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val error: ApiError? = null,
    val meta: Map<String, JsonElement>? = null
)

@Serializable
data class ApiError(
    val code: String,
    val message: String,
    val details: List<ApiErrorDetail>? = null
)

@Serializable
data class ApiErrorDetail(
    val field: String? = null,
    val code: String? = null,
    val message: String
)

@Serializable
data class PaginatedData<T>(
    val items: List<T> = emptyList(),
    val pagination: PaginationMeta? = null
)

@Serializable
data class PaginationMeta(
    val page: Int = 1,
    val limit: Int = 20,
    val total: Int = 0,
    val totalPages: Int = 0,
    val hasMore: Boolean = false
)

