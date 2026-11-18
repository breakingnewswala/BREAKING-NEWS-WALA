package com.breakingnewswala.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.breakingnewswala.ai.AiFactCheckReport
import com.breakingnewswala.ai.AiReporterDraft
import com.breakingnewswala.ai.BnwAiService
import com.breakingnewswala.data.model.ArticleStatus
import com.breakingnewswala.data.model.NewsArticle
import com.breakingnewswala.data.model.UserProfile
import com.breakingnewswala.data.model.UserRole
import com.breakingnewswala.data.repository.NewsRepository
import com.google.firebase.firestore.FirebaseFirestoreException
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class DeskViewModel(
    private val uid: String,
    private val isMasterAdmin: Boolean,
    private val repository: NewsRepository,
    private val aiService: BnwAiService
) : ViewModel() {

    private val _aiDraftState = MutableStateFlow<UiState<AiReporterDraft>?>(null)
    val aiDraftState: StateFlow<UiState<AiReporterDraft>?> = _aiDraftState.asStateFlow()

    private val _factCheckState = MutableStateFlow<Map<String, UiState<AiFactCheckReport>>>(emptyMap())
    val factCheckState: StateFlow<Map<String, UiState<AiFactCheckReport>>> = _factCheckState.asStateFlow()

    private val _isSubmitting = MutableStateFlow(false)
    val isSubmitting: StateFlow<Boolean> = _isSubmitting.asStateFlow()

    private val _deskMessage = MutableStateFlow<String?>(null)
    val deskMessage: StateFlow<String?> = _deskMessage.asStateFlow()

    val myArticlesState: StateFlow<UiState<List<NewsArticle>>> =
        repository.observeMyArticles(uid)
            .map<List<NewsArticle>, UiState<List<NewsArticle>>> { UiState.Success(it) }
            .catch { error ->
                val fsEx = generateSequence(error) { it.cause }
                    .filterIsInstance<FirebaseFirestoreException>()
                    .firstOrNull()
                if (fsEx == null && error is CancellationException) throw error
                emit(UiState.Error(fsEx?.localizedMessage ?: "आपकी खबरें लोड नहीं हो सकीं।"))
            }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(5000L),
                initialValue = UiState.Loading
            )

    val pendingArticlesState: StateFlow<UiState<List<NewsArticle>>> =
        if (isMasterAdmin) {
            repository.observePendingArticlesForAdmin()
                .map<List<NewsArticle>, UiState<List<NewsArticle>>> { UiState.Success(it) }
                .catch { error ->
                    val fsEx = generateSequence(error) { it.cause }
                        .filterIsInstance<FirebaseFirestoreException>()
                        .firstOrNull()
                    if (fsEx == null && error is CancellationException) throw error
                    emit(UiState.Error(fsEx?.localizedMessage ?: "सत्यापन कतार लोड नहीं हो सकी।"))
                }
                .stateIn(
                    scope = viewModelScope,
                    started = SharingStarted.WhileSubscribed(5000L),
                    initialValue = UiState.Loading
                )
        } else {
            MutableStateFlow(UiState.Success(emptyList()))
        }

    val allUsersState: StateFlow<UiState<List<UserProfile>>> =
        if (isMasterAdmin) {
            repository.observeAllUsersForMasterAdmin()
                .map<List<UserProfile>, UiState<List<UserProfile>>> { UiState.Success(it) }
                .catch { error ->
                    val fsEx = generateSequence(error) { it.cause }
                        .filterIsInstance<FirebaseFirestoreException>()
                        .firstOrNull()
                    if (fsEx == null && error is CancellationException) throw error
                    emit(UiState.Error(fsEx?.localizedMessage ?: "उपयोगकर्ता सूची लोड नहीं हो सकी।"))
                }
                .stateIn(
                    scope = viewModelScope,
                    started = SharingStarted.WhileSubscribed(5000L),
                    initialValue = UiState.Loading
                )
        } else {
            MutableStateFlow(UiState.Success(emptyList()))
        }

    fun generateReporterDraft(roughNotes: String, district: String) {
        if (roughNotes.trim().length < 10) {
            _deskMessage.value = "AI सहायता के लिए कम से कम 10 अक्षरों के नोट्स लिखें।"
            return
        }
        viewModelScope.launch {
            _aiDraftState.value = UiState.Loading
            aiService.assistReporter(roughNotes, district)
                .onSuccess { draft ->
                    _aiDraftState.value = UiState.Success(draft)
                }
                .onFailure { error ->
                    _aiDraftState.value = UiState.Error(
                        error.localizedMessage ?: "AI ड्राफ्ट तैयार नहीं हो सका।"
                    )
                }
        }
    }

    fun clearAiDraft() {
        _aiDraftState.value = null
    }

    fun submitNewsReport(
        title: String,
        summary: String,
        content: String,
        category: String,
        district: String,
        profile: UserProfile,
        publishImmediately: Boolean,
        breaking: Boolean,
        live: Boolean,
        onSuccess: () -> Unit
    ) {
        viewModelScope.launch {
            _isSubmitting.value = true
            repository.submitArticle(
                title = title,
                summary = summary,
                content = content,
                category = category,
                district = district,
                authorProfile = profile,
                publishImmediatelyIfAdmin = publishImmediately,
                breaking = breaking,
                live = live,
                aiScore = null
            ).onSuccess {
                _deskMessage.value = if (publishImmediately && (profile.userRole == UserRole.ADMIN || isMasterAdmin)) {
                    "समाचार तुरंत लाइव प्रकाशित हो गया!"
                } else {
                    "आपकी रिपोर्ट केंद्रीय संपादकीय डेस्क को भेज दी गई है।"
                }
                onSuccess()
            }.onFailure { error ->
                _deskMessage.value = error.localizedMessage ?: "रिपोर्ट भेजने में त्रुटि हुई।"
            }
            _isSubmitting.value = false
        }
    }

    fun runAiFactCheck(article: NewsArticle) {
        viewModelScope.launch {
            _factCheckState.value = _factCheckState.value + (article.id to UiState.Loading)
            aiService.evaluateEditorialFactCheck(
                title = article.title,
                content = article.content,
                district = article.district
            ).onSuccess { report ->
                _factCheckState.value = _factCheckState.value + (article.id to UiState.Success(report))
            }.onFailure { error ->
                _factCheckState.value = _factCheckState.value + (
                    article.id to UiState.Error(error.localizedMessage ?: "फैक्ट-चेक विफल रहा।")
                )
            }
        }
    }

    fun moderateArticle(
        article: NewsArticle,
        newStatus: ArticleStatus,
        breaking: Boolean,
        live: Boolean,
        editorialNote: String?,
        aiScore: Int?
    ) {
        viewModelScope.launch {
            repository.moderateArticle(
                articleId = article.id,
                newStatus = newStatus,
                breaking = breaking,
                live = live,
                editorialNote = editorialNote,
                aiScore = aiScore
            ).onSuccess {
                _deskMessage.value = when (newStatus) {
                    ArticleStatus.PUBLISHED -> "खबर स्वीकृत होकर प्रकाशित कर दी गई।"
                    ArticleStatus.REJECTED -> "खबर को अस्वीकृत चिह्नित किया गया।"
                    else -> "स्थिति अपडेट हो गई।"
                }
            }.onFailure { error ->
                _deskMessage.value = error.localizedMessage ?: "मॉडरेशन विफल रहा।"
            }
        }
    }

    fun assignUserRole(targetUid: String, newRole: UserRole) {
        viewModelScope.launch {
            repository.updateUserRoleByAdmin(targetUid, newRole)
                .onSuccess {
                    _deskMessage.value = "भूमिका अपडेट होकर '${newRole.labelHi}' हो गई।"
                }
                .onFailure { error ->
                    _deskMessage.value = error.localizedMessage ?: "भूमिका बदलने में समस्या आई।"
                }
        }
    }

    fun clearDeskMessage() {
        _deskMessage.value = null
    }
}
