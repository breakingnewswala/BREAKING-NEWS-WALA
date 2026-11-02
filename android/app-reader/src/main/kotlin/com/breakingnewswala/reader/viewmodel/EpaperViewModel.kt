package com.breakingnewswala.reader.viewmodel

import android.graphics.Bitmap
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.breakingnewswala.core.analytics.AnalyticsTracker
import com.breakingnewswala.core.model.EpaperEdition
import com.breakingnewswala.core.network.EpaperApiService
import com.breakingnewswala.core.network.NetworkClient
import com.breakingnewswala.core.network.NetworkResult
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class EpaperUiState(
    val isLoading: Boolean = true,
    val editions: List<EpaperEdition> = emptyList(),
    val selectedEdition: EpaperEdition? = null,
    val currentPageIndex: Int = 0,
    val renderedPageBitmap: Bitmap? = null,
    val errorMessage: String? = null
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

    fun loadEditions(districtId: String? = null, date: String? = null) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            val result = NetworkClient.safeApiCall {
                epaperApi.getEditions(districtId = districtId, date = date)
            }

            when (result) {
                is NetworkResult.Success -> {
                    val list = result.data
                    val selected = list.firstOrNull()
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        editions = list,
                        selectedEdition = selected,
                        currentPageIndex = 0
                    )
                    if (selected != null) {
                        analyticsTracker.trackEpaperOpened(selected.id, selected.districtId)
                    }
                }
                is NetworkResult.Error -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = result.message
                    )
                }
                NetworkResult.Loading -> {}
            }
        }
    }

    fun selectEdition(edition: EpaperEdition) {
        _uiState.value = _uiState.value.copy(
            selectedEdition = edition,
            currentPageIndex = 0
        )
        analyticsTracker.trackEpaperOpened(edition.id, edition.districtId)
    }

    fun onPageChanged(pageIndex: Int) {
        val edition = _uiState.value.selectedEdition ?: return
        _uiState.value = _uiState.value.copy(currentPageIndex = pageIndex)
        analyticsTracker.trackEpaperPageViewed(edition.id, pageIndex + 1)
    }

    fun downloadEdition() {
        val edition = _uiState.value.selectedEdition ?: return
        analyticsTracker.trackEpaperDownloaded(edition.id)
    }
}

