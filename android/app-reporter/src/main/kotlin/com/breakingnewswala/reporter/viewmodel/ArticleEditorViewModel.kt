package com.breakingnewswala.reporter.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.breakingnewswala.core.media.MediaUploader
import com.breakingnewswala.core.model.*
import com.breakingnewswala.core.network.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.io.File

data class ArticleEditorUiState(
    val articleId: String? = null,
    val title: String = "",
    val summary: String = "",
    val content: String = "",
    val selectedCategoryId: String? = null,
    val selectedDivisionId: String? = null,
    val selectedDistrictId: String? = null,
    val featuredImageId: String? = null,
    val featuredImageUrl: String? = null,
    val imageCaption: String = "",
    val isBreaking: Boolean = false,
    val categories: List<CategoryItem> = emptyList(),
    val assignedDistricts: List<DistrictItem> = emptyList(),
    val assignedDivisions: List<DivisionItem> = emptyList(),
    val uploadProgress: Int = 0,
    val isUploading: Boolean = false,
    val isSaving: Boolean = false,
    val isSubmitting: Boolean = false,
    val isDirectPublishing: Boolean = false,
    val saveSuccessMessage: String? = null,
    val submitSuccess: Boolean = false,
    val errorMessage: String? = null
)

class ArticleEditorViewModel(
    private val newsApi: NewsApiService,
    private val categoryApi: CategoryApiService,
    private val territoryApi: TerritoryApiService,
    private val mediaUploader: MediaUploader
) : ViewModel() {

    private val _uiState = MutableStateFlow(ArticleEditorUiState())
    val uiState: StateFlow<ArticleEditorUiState> = _uiState.asStateFlow()

    init {
        loadMetadata()
    }

    private fun loadMetadata() {
        viewModelScope.launch {
            val catResult = NetworkClient.safeApiCall { categoryApi.getCategories() }
            val categories = if (catResult is NetworkResult.Success) catResult.data else emptyList()

            // Fetch reporter beats to restrict district selection
            val beatResult = NetworkClient.safeApiCall { territoryApi.getMyAssignments() }
            val assignments = if (beatResult is NetworkResult.Success) beatResult.data else emptyList()

            // Fetch all districts to match assigned names
            val distResult = NetworkClient.safeApiCall { territoryApi.getDistricts() }
            val allDistricts = if (distResult is NetworkResult.Success) distResult.data else emptyList()

            val assignedDistrictIds = assignments.mapNotNull { it.districtId }.toSet()
            val filteredDistricts = allDistricts.filter { assignedDistrictIds.contains(it.id) || assignedDistrictIds.isEmpty() }

            _uiState.value = _uiState.value.copy(
                categories = categories,
                assignedDistricts = filteredDistricts,
                selectedCategoryId = categories.firstOrNull()?.id,
                selectedDistrictId = filteredDistricts.firstOrNull()?.id,
                selectedDivisionId = filteredDistricts.firstOrNull()?.divisionId
            )
        }
    }

    fun loadArticleForEditing(articleId: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSaving = true)
            val result = NetworkClient.safeApiCall { newsApi.getDraft(articleId) }

            if (result is NetworkResult.Success) {
                val a = result.data
                _uiState.value = _uiState.value.copy(
                    articleId = a.id,
                    title = a.title,
                    summary = a.summary ?: "",
                    content = a.content,
                    selectedCategoryId = a.categoryId,
                    selectedDistrictId = a.districtId,
                    featuredImageUrl = a.featuredImage,
                    imageCaption = a.imageCaption ?: "",
                    isBreaking = a.isBreaking,
                    isSaving = false
                )
            } else if (result is NetworkResult.Error) {
                _uiState.value = _uiState.value.copy(
                    isSaving = false,
                    errorMessage = result.message
                )
            }
        }
    }

    fun onTitleChange(value: String) {
        _uiState.value = _uiState.value.copy(title = value, errorMessage = null)
    }

    fun onSummaryChange(value: String) {
        _uiState.value = _uiState.value.copy(summary = value)
    }

    fun onContentChange(value: String) {
        _uiState.value = _uiState.value.copy(content = value, errorMessage = null)
    }

    fun onCategorySelect(categoryId: String) {
        _uiState.value = _uiState.value.copy(selectedCategoryId = categoryId)
    }

    fun onDistrictSelect(district: DistrictItem) {
        _uiState.value = _uiState.value.copy(
            selectedDistrictId = district.id,
            selectedDivisionId = district.divisionId
        )
    }

    fun onBreakingToggle(value: Boolean) {
        _uiState.value = _uiState.value.copy(isBreaking = value)
    }

    fun onCaptionChange(value: String) {
        _uiState.value = _uiState.value.copy(imageCaption = value)
    }

    fun uploadMedia(file: File, mimeType: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isUploading = true, uploadProgress = 0, errorMessage = null)
            val result = mediaUploader.uploadFile(
                file = file,
                mimeType = mimeType,
                altTextHi = _uiState.value.imageCaption.ifBlank { "समाचार छायाचित्र" },
                onProgress = { progress ->
                    _uiState.value = _uiState.value.copy(uploadProgress = progress)
                }
            )

            when (result) {
                is NetworkResult.Success -> {
                    _uiState.value = _uiState.value.copy(
                        isUploading = false,
                        uploadProgress = 100,
                        featuredImageId = result.data.id,
                        featuredImageUrl = result.data.url
                    )
                }
                is NetworkResult.Error -> {
                    _uiState.value = _uiState.value.copy(
                        isUploading = false,
                        errorMessage = "मीडिया अपलोड विफल: ${result.message}"
                    )
                }
                NetworkResult.Loading -> {}
            }
        }
    }

    companion object {
        val DEVANAGARI_REGEX = Regex("[\\u0900-\\u097F]")
    }

    /**
     * Counts words by splitting across spaces, tabs, and newlines.
     * Matches backend countWords() implementation in article.validator.ts.
     */
    fun countWords(text: String): Int {
        if (text.isBlank()) return 0
        return text.trim().split(Regex("\\s+")).filter { it.isNotBlank() }.size
    }

    /**
     * Validates news headline according to canonical RULE-NEWS-003 and backend article.validator.ts:
     * - Minimum 15 characters
     * - Maximum 150 characters
     * - Mandatory Devanagari script presence
     */
    fun validateHeadline(title: String): String? {
        val trimmed = title.trim()
        if (trimmed.length < 15) {
            return "समाचार शीर्षक कम से कम 15 अक्षरों का होना अनिवार्य है (RULE-NEWS-003)।"
        }
        if (trimmed.length > 150) {
            return "समाचार शीर्षक 150 अक्षरों से अधिक नहीं हो सकता (RULE-NEWS-003)।"
        }
        if (!DEVANAGARI_REGEX.containsMatchIn(trimmed)) {
            return "समाचार शीर्षक में हिंदी (देवनागरी) अक्षर होना अनिवार्य है (RULE-NEWS-003)।"
        }
        return null
    }

    fun isHeadlineValid(title: String): Boolean = validateHeadline(title) == null

    /**
     * Validates news body content according to canonical RULE-NEWS-004 and backend article.validator.ts:
     * - Minimum 50 words OR 250 characters
     * - Maximum 5,000 words
     */
    fun validateBodyContent(content: String): String? {
        val trimmed = content.trim()
        val words = countWords(trimmed)
        val chars = trimmed.length
        if (words < 50 && chars < 250) {
            return "समाचार विवरण में कम से कम 50 शब्द या 250 अक्षर होने आवश्यक हैं (RULE-NEWS-004)।"
        }
        if (words > 5000) {
            return "समाचार विवरण 5,000 शब्दों से अधिक नहीं हो सकता (RULE-NEWS-004)।"
        }
        return null
    }

    fun isBodyContentValid(content: String): Boolean = validateBodyContent(content) == null

    fun saveDraft(onSaved: ((String) -> Unit)? = null) {
        val s = _uiState.value
        val headlineError = validateHeadline(s.title)
        if (headlineError != null) {
            _uiState.value = s.copy(errorMessage = headlineError)
            return
        }

        val words = countWords(s.content)
        if (words > 5000) {
            _uiState.value = s.copy(errorMessage = "समाचार विवरण 5,000 शब्दों से अधिक नहीं हो सकता (RULE-NEWS-004)।")
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSaving = true, errorMessage = null)

            val currentId = s.articleId
            if (currentId == null) {
                // Create Draft
                val request = CreateDraftRequest(
                    title = s.title.trim(),
                    summary = s.summary.trim().ifBlank { null },
                    content = s.content.trim(),
                    categoryId = s.selectedCategoryId ?: "",
                    divisionId = s.selectedDivisionId,
                    districtId = s.selectedDistrictId ?: "",
                    featuredImageId = s.featuredImageId,
                    imageCaption = s.imageCaption.ifBlank { null },
                    isBreaking = s.isBreaking
                )

                val result = NetworkClient.safeApiCall { newsApi.createDraft(request) }
                handleSaveResult(result, onSaved)
            } else {
                // Update Draft
                val request = UpdateDraftRequest(
                    title = s.title.trim(),
                    summary = s.summary.trim().ifBlank { null },
                    content = s.content.trim(),
                    categoryId = s.selectedCategoryId,
                    divisionId = s.selectedDivisionId,
                    districtId = s.selectedDistrictId,
                    featuredImageId = s.featuredImageId,
                    imageCaption = s.imageCaption.ifBlank { null },
                    isBreaking = s.isBreaking
                )

                val result = NetworkClient.safeApiCall { newsApi.updateDraft(currentId, request) }
                handleSaveResult(result, onSaved)
            }
        }
    }

    private fun handleSaveResult(
        result: NetworkResult<ArticleDetail>,
        onSaved: ((String) -> Unit)?
    ) {
        when (result) {
            is NetworkResult.Success -> {
                val article = result.data
                _uiState.value = _uiState.value.copy(
                    isSaving = false,
                    articleId = article.id,
                    saveSuccessMessage = "ड्राफ्ट सफलतापूर्वक सहेजा गया।"
                )
                onSaved?.invoke(article.id)
            }
            is NetworkResult.Error -> {
                _uiState.value = _uiState.value.copy(
                    isSaving = false,
                    errorMessage = result.message
                )
            }
            NetworkResult.Loading -> {}
        }
    }

    fun submitArticle() {
        val s = _uiState.value
        val headlineError = validateHeadline(s.title)
        if (headlineError != null) {
            _uiState.value = s.copy(errorMessage = headlineError)
            return
        }
        val bodyError = validateBodyContent(s.content)
        if (bodyError != null) {
            _uiState.value = s.copy(errorMessage = bodyError)
            return
        }

        // Save first then submit
        saveDraft { savedId ->
            viewModelScope.launch {
                _uiState.value = _uiState.value.copy(isSubmitting = true, errorMessage = null)
                val submitResult = NetworkClient.safeApiCall { newsApi.submitArticle(savedId) }

                when (submitResult) {
                    is NetworkResult.Success -> {
                        _uiState.value = _uiState.value.copy(
                            isSubmitting = false,
                            submitSuccess = true
                        )
                    }
                    is NetworkResult.Error -> {
                        _uiState.value = _uiState.value.copy(
                            isSubmitting = false,
                            errorMessage = submitResult.message
                        )
                    }
                    NetworkResult.Loading -> {}
                }
            }
        }
    }

    fun directPublish() {
        val s = _uiState.value
        val headlineError = validateHeadline(s.title)
        if (headlineError != null) {
            _uiState.value = s.copy(errorMessage = headlineError)
            return
        }
        val bodyError = validateBodyContent(s.content)
        if (bodyError != null) {
            _uiState.value = s.copy(errorMessage = bodyError)
            return
        }

        saveDraft { savedId ->
            viewModelScope.launch {
                _uiState.value = _uiState.value.copy(isDirectPublishing = true, errorMessage = null)
                val result = NetworkClient.safeApiCall { newsApi.directPublish(savedId) }

                when (result) {
                    is NetworkResult.Success -> {
                        _uiState.value = _uiState.value.copy(
                            isDirectPublishing = false,
                            submitSuccess = true
                        )
                    }
                    is NetworkResult.Error -> {
                        _uiState.value = _uiState.value.copy(
                            isDirectPublishing = false,
                            errorMessage = result.message
                        )
                    }
                    NetworkResult.Loading -> {}
                }
            }
        }
    }
}

