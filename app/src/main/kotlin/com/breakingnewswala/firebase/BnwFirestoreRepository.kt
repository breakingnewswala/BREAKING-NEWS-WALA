package com.breakingnewswala.firebase

import android.content.Context
import com.breakingnewswala.R
import com.google.firebase.Firebase
import com.google.firebase.auth.auth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.google.firebase.firestore.snapshots
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.tasks.await

class BnwFirestoreRepository(private val db: FirebaseFirestore) {

    constructor(context: Context) : this(
        FirebaseFirestore.getInstance(
            context.applicationContext.getString(R.string.firestore_database_id)
        )
    )

    private val auth = Firebase.auth

    private fun requireUserId(): String {
        return auth.currentUser?.uid
            ?: throw IllegalStateException("User must be signed in with Google before accessing Firestore.")
    }

    // Save or update user profile
    suspend fun saveUserProfile(user: UserFirestoreModel) {
        val uid = requireUserId()
        require(user.id == uid) { "User ID must match authenticated Google UID" }
        val docRef = db.collection("users").document(uid)
        try {
            val payload = hashMapOf<String, Any>(
                "id" to uid,
                "displayName" to user.displayName.ifBlank { "पाठक" },
                "role" to user.role,
                "email" to user.email,
                "photoUrl" to user.photoUrl,
                "district" to user.district,
                "division" to user.division,
                "state" to user.state,
                "updatedAt" to FieldValue.serverTimestamp()
            )
            if (user.createdAt == null) {
                payload["createdAt"] = FieldValue.serverTimestamp()
            }
            docRef.set(payload, com.google.firebase.firestore.SetOptions.merge()).await()
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.WRITE, docRef.path)
            throw e
        }
    }

    // Observe user profile in real-time
    fun observeUserProfile(userId: String): Flow<UserFirestoreModel?> = flow {
        val path = "users/$userId"
        val docRef = db.collection("users").document(userId)
        docRef.snapshots()
            .map { snapshot ->
                if (snapshot.exists()) snapshot.toObject(UserFirestoreModel::class.java) else null
            }
            .catch { error ->
                if (error is Exception) handleFirestoreError(error, OperationType.GET, path)
                throw error
            }
            .collect { emit(it) }
    }

    // Submit article (by reporter or editor)
    suspend fun submitArticle(article: ArticleFirestoreModel): String {
        val uid = requireUserId()
        val collectionRef = db.collection("articles")
        try {
            val docRef = collectionRef.document()
            val payload = hashMapOf<String, Any>(
                "id" to docRef.id,
                "title" to article.title,
                "excerpt" to article.excerpt,
                "content" to article.content,
                "category" to article.category,
                "district" to article.district,
                "division" to article.division,
                "state" to article.state,
                "authorId" to uid,
                "authorName" to article.authorName,
                "authorRole" to article.authorRole,
                "status" to article.status,
                "imageUrl" to article.imageUrl,
                "isBreaking" to article.isBreaking,
                "isLive" to article.isLive,
                "viewCount" to 0L,
                "createdAt" to FieldValue.serverTimestamp(),
                "updatedAt" to FieldValue.serverTimestamp()
            )
            docRef.set(payload).await()
            return docRef.id
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, collectionRef.path)
            throw e
        }
    }

    // Observe published articles
    fun observePublishedArticles(district: String? = null): Flow<List<ArticleFirestoreModel>> = flow {
        val path = "articles"
        var query: Query = db.collection(path)
            .whereEqualTo("status", "PUBLISHED")
            .orderBy("createdAt", Query.Direction.DESCENDING)

        if (!district.isNullOrBlank() && district != "सभी ज़िले (All MP)") {
            val cleanDistrict = district.substringBefore(" (")
            query = query.whereEqualTo("district", cleanDistrict)
        }

        query.snapshots()
            .map { snapshot -> snapshot.toObjects(ArticleFirestoreModel::class.java) }
            .catch { error ->
                if (error is Exception) handleFirestoreError(error, OperationType.LIST, path)
                throw error
            }
            .collect { emit(it) }
    }

    // Bookmarks subcollection
    suspend fun addBookmark(bookmark: BookmarkFirestoreModel) {
        val uid = requireUserId()
        val docRef = db.collection("users").document(uid).collection("bookmarks").document(bookmark.articleId)
        try {
            val payload = hashMapOf<String, Any>(
                "id" to bookmark.articleId,
                "userId" to uid,
                "articleId" to bookmark.articleId,
                "articleTitle" to bookmark.articleTitle,
                "articleCategory" to bookmark.articleCategory,
                "articleDistrict" to bookmark.articleDistrict,
                "articleImageUrl" to bookmark.articleImageUrl,
                "savedAt" to FieldValue.serverTimestamp()
            )
            docRef.set(payload).await()
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.WRITE, docRef.path)
            throw e
        }
    }

    suspend fun removeBookmark(articleId: String) {
        val uid = requireUserId()
        val docRef = db.collection("users").document(uid).collection("bookmarks").document(articleId)
        try {
            docRef.delete().await()
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.DELETE, docRef.path)
            throw e
        }
    }

    fun observeBookmarks(userId: String): Flow<List<BookmarkFirestoreModel>> = flow {
        val path = "users/$userId/bookmarks"
        db.collection("users").document(userId).collection("bookmarks")
            .orderBy("savedAt", Query.Direction.DESCENDING)
            .snapshots()
            .map { snapshot -> snapshot.toObjects(BookmarkFirestoreModel::class.java) }
            .catch { error ->
                if (error is Exception) handleFirestoreError(error, OperationType.LIST, path)
                throw error
            }
            .collect { emit(it) }
    }
}
