package com.breakingnewswala.core.network

import com.breakingnewswala.core.model.ApiErrorDetail

sealed class NetworkResult<out T> {
    data class Success<out T>(val data: T) : NetworkResult<T>()
    data class Error(
        val code: String,
        val message: String,
        val statusCode: Int? = null,
        val details: List<ApiErrorDetail>? = null
    ) : NetworkResult<Nothing>()
    data object Loading : NetworkResult<Nothing>()

    fun isSuccess(): Boolean = this is Success
    fun isError(): Boolean = this is Error
    fun isLoading(): Boolean = this is Loading

    fun getOrNull(): T? = if (this is Success) data else null
}

