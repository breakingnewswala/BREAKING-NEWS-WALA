package com.breakingnewswala.reporter.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.breakingnewswala.core.auth.AuthRepository
import com.breakingnewswala.core.auth.AuthState
import com.breakingnewswala.core.model.AuthUser
import com.breakingnewswala.core.network.NetworkResult
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ReporterAuthUiState(
    val isLoading: Boolean = false,
    val isAuthenticated: Boolean = false,
    val user: AuthUser? = null,
    val errorMessage: String? = null
)

class ReporterAuthViewModel(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ReporterAuthUiState())
    val uiState: StateFlow<ReporterAuthUiState> = _uiState.asStateFlow()

    init {
        checkSession()
    }

    fun checkSession() {
        viewModelScope.launch {
            val user = authRepository.currentUser.value
            if (user != null && (user.roles.contains("REPORTER") || user.roles.contains("BUREAU_CHIEF") || user.roles.contains("ADMIN") || user.roles.contains("SUPER_ADMIN"))) {
                _uiState.value = ReporterAuthUiState(isAuthenticated = true, user = user)
            } else {
                _uiState.value = ReporterAuthUiState(isAuthenticated = false)
            }
        }
    }

    fun login(identifier: String, password: String) {
        if (identifier.isBlank() || password.isBlank()) {
            _uiState.value = _uiState.value.copy(errorMessage = "कृपया मोबाइल नंबर/ईमेल और पासवर्ड दर्ज करें।")
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            val result = authRepository.login(identifier.trim(), password)

            when (result) {
                is NetworkResult.Success -> {
                    val user = result.data
                    val isAuthorized = user.roles.contains("REPORTER") ||
                            user.roles.contains("BUREAU_CHIEF") ||
                            user.roles.contains("ADMIN") ||
                            user.roles.contains("SUPER_ADMIN")

                    if (!isAuthorized) {
                        authRepository.clearTokens()
                        _uiState.value = ReporterAuthUiState(
                            isLoading = false,
                            isAuthenticated = false,
                            errorMessage = "अनधिकृत: इस एप्लिकेशन का उपयोग केवल मान्यता प्राप्त रिपोर्टर ही कर सकते हैं।"
                        )
                    } else {
                        _uiState.value = ReporterAuthUiState(
                            isLoading = false,
                            isAuthenticated = true,
                            user = user
                        )
                    }
                }
                is NetworkResult.Error -> {
                    _uiState.value = ReporterAuthUiState(
                        isLoading = false,
                        isAuthenticated = false,
                        errorMessage = result.message
                    )
                }
                NetworkResult.Loading -> {}
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
            _uiState.value = ReporterAuthUiState(isAuthenticated = false, user = null)
        }
    }
}

