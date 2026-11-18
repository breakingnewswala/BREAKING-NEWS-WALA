package com.breakingnewswala.viewmodel

import com.breakingnewswala.data.SeedNewsData
import com.breakingnewswala.data.model.BookmarkItem
import com.breakingnewswala.data.model.EpaperEdition
import com.breakingnewswala.data.model.NewsArticle
import com.breakingnewswala.data.model.UserProfile
import com.breakingnewswala.data.repository.NewsRepository
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.firestore.FirebaseFirestoreException
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

sealed interface UiState<out T> {
    data object Loading : UiState<Nothing>
    data class Success<T>(val data: T) : UiState<T>
    data class Error(val message: String) : UiState<Nothing>
}

data class HomeFeedData(
    val allArticles: List<NewsArticle>,
    val filteredArticles: List<NewsArticle>,
    val breakingHeadlines: List<NewsArticle>,
    val selectedCategory: String,
    val selectedDistrict: String
)

class MainViewModel(
    private val uid: String,
    private val currentUser: FirebaseUser,
    private val repository: NewsRepository
) : ViewModel() {

    private val _selectedCategory = MutableStateFlow("सभी")
    val selectedCategory: StateFlow<String> = _selectedCategory.asStateFlow()

    private val _selectedDistrict = MutableStateFlow("सभी जिले")
    val selectedDistrict: StateFlow<String> = _selectedDistrict.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _statusMessage = MutableStateFlow<String?>(null)
    val statusMessage: StateFlow<String?> = _statusMessage.asStateFlow()

    val epaperEditionsState: StateFlow<UiState<List<EpaperEdition>>> =
        repository.observePublishedEpaperEditions()
            .map<List<EpaperEdition>, UiState<List<EpaperEdition>>> { UiState.Success(it) }
            .catch {
                emit(UiState.Success(SeedNewsData.epaperEditions))
            }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(5_000),
                initialValue = UiState.Success(SeedNewsData.epaperEditions)
            )

    val epaperEditions: List<EpaperEdition>
        get() = (epaperEditionsState.value as? UiState.Success)?.data ?: SeedNewsData.epaperEditions

    init {
        viewModelScope.launch {
            val result = repository.ensureUserProfile(currentUser)
            result.onFailure { error ->
                _statusMessage.value = error.localizedMessage ?: "प्रोफ़ाइल सिंक में समस्या आई।"
            }
        }
    }

    val userProfileState: StateFlow<UiState<UserProfile?>> =
        repository.observeUserProfile(uid)
            .map<UserProfile?, UiState<UserProfile?>> { UiState.Success(it) }
            .catch { error ->
                val fsEx = generateSequence(error) { it.cause }
                    .filterIsInstance<FirebaseFirestoreException>()
                    .firstOrNull()
                if (fsEx == null && error is CancellationException) throw error
                emit(UiState.Error(fsEx?.localizedMessage ?: error.localizedMessage ?: "प्रोफ़ाइल लोड नहीं हो सकी।"))
            }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(5000L),
                initialValue = UiState.Loading
            )

    private val combinedArticlesFlow =
        repository.observePublishedArticles()
            .map { firestoreArticles ->
                val merged = (firestoreArticles + SeedNewsData.curatedArticles)
                    .distinctBy { it.id }
                merged
            }

    val feedState: StateFlow<UiState<HomeFeedData>> =
        combine(
            combinedArticlesFlow,
            _selectedCategory,
            _selectedDistrict
        ) { articles, category, district ->
            val filtered = articles.filter { article ->
                val catMatch = when (category) {
                    "सभी" -> true
                    "ब्रेकिंग" -> article.breaking || article.live
                    else -> article.category == category
                }
                val distMatch = district == "सभी जिले" || article.district == district
                catMatch && distMatch
            }
            val breaking = articles.filter { it.breaking || it.live }.ifEmpty { articles.take(3) }
            val result: UiState<HomeFeedData> = UiState.Success(
                HomeFeedData(
                    allArticles = articles,
                    filteredArticles = filtered,
                    breakingHeadlines = breaking,
                    selectedCategory = category,
                    selectedDistrict = district
                )
            )
            result
        }
            .catch { error ->
                val fsEx = generateSequence(error) { it.cause }
                    .filterIsInstance<FirebaseFirestoreException>()
                    .firstOrNull()
                if (fsEx == null && error is CancellationException) throw error
                emit(UiState.Error(fsEx?.localizedMessage ?: "समाचार फ़ीड लोड नहीं हो सकी।"))
            }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(5000L),
                initialValue = UiState.Loading
            )

    val searchResultsState: StateFlow<UiState<List<NewsArticle>>> =
        combine(combinedArticlesFlow, _searchQuery, _selectedDistrict) { articles, query, district ->
            val q = query.trim().lowercase()
            val filtered = articles.filter { article ->
                val distOk = district == "सभी जिले" || article.district == district
                val queryOk = q.isEmpty() ||
                    article.title.lowercase().contains(q) ||
                    article.summary.lowercase().contains(q) ||
                    article.district.lowercase().contains(q) ||
                    article.category.lowercase().contains(q) ||
                    article.state.lowercase().contains(q)
                distOk && queryOk
            }
            val result: UiState<List<NewsArticle>> = UiState.Success(filtered)
            result
        }
            .catch { error ->
                val fsEx = generateSequence(error) { it.cause }
                    .filterIsInstance<FirebaseFirestoreException>()
                    .firstOrNull()
                if (fsEx == null && error is CancellationException) throw error
                emit(UiState.Error(fsEx?.localizedMessage ?: "खोज परिणाम लोड नहीं हो सके।"))
            }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(5000L),
                initialValue = UiState.Loading
            )

    val bookmarksState: StateFlow<UiState<List<BookmarkItem>>> =
        repository.observeBookmarks(uid)
            .map<List<BookmarkItem>, UiState<List<BookmarkItem>>> { UiState.Success(it) }
            .catch { error ->
                val fsEx = generateSequence(error) { it.cause }
                    .filterIsInstance<FirebaseFirestoreException>()
                    .firstOrNull()
                if (fsEx == null && error is CancellationException) throw error
                emit(UiState.Error(fsEx?.localizedMessage ?: "बुकमार्क लोड नहीं हो सके।"))
            }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(5000L),
                initialValue = UiState.Loading
            )

    fun selectCategory(category: String) {
        _selectedCategory.value = category
    }

    fun selectDistrict(district: String) {
        _selectedDistrict.value = district
    }

    fun updateSearchQuery(query: String) {
        _searchQuery.value = query
    }

    fun updatePreferredDistrict(district: String) {
        viewModelScope.launch {
            repository.updatePreferredDistrict(district)
                .onSuccess {
                    _statusMessage.value = "पसंदीदा जिला '$district' सहेजा गया।"
                }
                .onFailure {
                    _statusMessage.value = "जिला अपडेट नहीं हो सका।"
                }
        }
    }

    fun toggleBookmark(article: NewsArticle, currentlyBookmarked: Boolean) {
        viewModelScope.launch {
            repository.toggleBookmark(article, currentlyBookmarked)
                .onSuccess { saved ->
                    _statusMessage.value = if (saved) {
                        "खबर बुकमार्क में सेव की गई।"
                    } else {
                        "बुकमार्क से हटाई गई।"
                    }
                }
                .onFailure { error ->
                    _statusMessage.value = error.localizedMessage ?: "बुकमार्क अपडेट नहीं हो सका।"
                }
        }
    }

    fun findArticleById(articleId: String): NewsArticle? {
        val currentFeed = (feedState.value as? UiState.Success)?.data?.allArticles
            ?: SeedNewsData.curatedArticles
        return currentFeed.firstOrNull { it.id == articleId }
    }

    fun clearStatusMessage() {
        _statusMessage.value = null
    }
}
