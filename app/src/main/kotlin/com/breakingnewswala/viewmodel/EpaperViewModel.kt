package com.breakingnewswala.viewmodel

import android.graphics.Bitmap
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.breakingnewswala.core.analytics.AnalyticsTracker
import com.breakingnewswala.core.model.EpaperEdition
import com.breakingnewswala.core.network.EpaperApiService
import com.breakingnewswala.core.network.NetworkClient
import com.breakingnewswala.core.network.NetworkResult
import com.breakingnewswala.data.MockNewsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class EpaperUiState(
    val isLoading: Boolean = false,
    val editions: List<EpaperEdition> = emptyList(),
    val selectedEdition: EpaperEdition? = null,
    val currentPageIndex: Int = 0,
    val renderedPageBitmap: Bitmap? = null,
    val downloadSuccessMessage: String? = null
)

class EpaperViewModel(
    private val epaperApi: EpaperApiService,
    private val analyticsTracker: AnalyticsTracker
) : ViewModel() {

    private val _uiState = MutableStateFlow(EpaperUiState())
    val uiState: StateFlow<EpaperUiState> = _uiState.asStateFlow()

    init {
        loadEditions()
    }

    fun loadEditions() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)

            val result = NetworkClient.safeApiCall { epaperApi.getEditions() }

            if (result is NetworkResult.Success && result.data.isNotEmpty()) {
                val editions = result.data
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    editions = editions,
                    selectedEdition = editions.firstOrNull(),
                    currentPageIndex = 0
                )
            } else {
                val editions = MockNewsRepository.epaperEditions
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    editions = editions,
                    selectedEdition = editions.firstOrNull(),
                    currentPageIndex = 0
                )
            }
        }
    }

    fun selectEdition(edition: EpaperEdition) {
        _uiState.value = _uiState.value.copy(
            selectedEdition = edition,
            currentPageIndex = 0,
            downloadSuccessMessage = null
        )
    }

    fun onPageChanged(newIndex: Int) {
        _uiState.value = _uiState.value.copy(currentPageIndex = newIndex)
    }

    fun downloadEdition() {
        viewModelScope.launch {
            _uiState.value.selectedEdition?.let { edition ->
                NetworkClient.safeApiCall { epaperApi.recordDownload(edition.id) }
                _uiState.value = _uiState.value.copy(
                    downloadSuccessMessage = "${edition.title} का डिजिटल PDF डाउनलोड प्रारंभ हो गया है।"
                )
            }
        }
    }
}
