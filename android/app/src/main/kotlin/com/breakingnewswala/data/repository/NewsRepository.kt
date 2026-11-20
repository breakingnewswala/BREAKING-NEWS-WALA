package com.breakingnewswala.data.repository

import com.breakingnewswala.data.model.ArticleStatus
import com.breakingnewswala.data.model.BookmarkItem
import com.breakingnewswala.data.model.EpaperEdition
import com.breakingnewswala.data.model.NewsArticle
import com.breakingnewswala.data.model.NewsTaxonomy
import com.breakingnewswala.data.model.UserProfile
import com.breakingnewswala.data.model.UserRole
import com.breakingnewswala.data.SeedNewsData
import com.breakingnewswala.firebase.OperationType
import com.breakingnewswala.firebase.handleFirestoreError
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.google.firebase.firestore.snapshots
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.tasks.await

private const val MASTER_ADMIN_EMAIL = "breakingnewswala.com@gmail.com"

class NewsRepository(
    private val db: FirebaseFirestore
) {

    private fun requireUid(): String =
        FirebaseAuth.getInstance().currentUser?.uid
            ?: throw IllegalStateException("कृपया आगे बढ़ने के लिए Google से साइन इन करें।")

    private fun isMasterAdminUser(user: FirebaseUser?): Boolean =
        user != null &&
            user.email.equals(MASTER_ADMIN_EMAIL, ignoreCase = true) &&
            user.isEmailVerified

    suspend fun ensureUserProfile(user: FirebaseUser): Result<UserProfile> {
        val path = "users/${user.uid}"
        return try {
            val docRef = db.collection("users").document(user.uid)
            val snapshot = docRef.get().await()
            if (snapshot.exists()) {
                val existing = snapshot.toObject(
                    UserProfile::class.java,
                    DocumentSnapshot.ServerTimestampBehavior.ESTIMATE
                )
                if (existing != null) {
                    // Ensure Master Admin always holds ADMIN role if verified
                    if (isMasterAdminUser(user) && existing.role != UserRole.ADMIN.name) {
                        docRef.update(
                            mapOf(
                                "role" to UserRole.ADMIN.name,
                                "updatedAt" to FieldValue.serverTimestamp()
                            )
                        ).await()
                        return Result.success(existing.copy(role = UserRole.ADMIN.name))
                    }
                    return Result.success(existing)
                }
            }

            val initialRole = if (isMasterAdminUser(user)) {
                UserRole.ADMIN.name
            } else {
                UserRole.READER.name
            }
            val safeName = (user.displayName?.trim().takeUnless { it.isNullOrEmpty() }
                ?: user.email?.substringBefore("@")
                ?: "पाठक").take(100)
            val safeEmail = (user.email ?: "").take(200)
            val safePhoto = user.photoUrl?.toString()?.take(1000)

            val payload = mutableMapOf<String, Any?>(
                "uid" to user.uid,
                "email" to safeEmail,
                "displayName" to safeName,
                "photoUrl" to safePhoto,
                "role" to initialRole,
                "district" to "नई दिल्ली",
                "coins" to 0,
                "createdAt" to FieldValue.serverTimestamp(),
                "updatedAt" to FieldValue.serverTimestamp()
            ).filterValues { it != null }

            docRef.set(payload).await()
            val created = UserProfile(
                id = user.uid,
                uid = user.uid,
                email = safeEmail,
                displayName = safeName,
                photoUrl = safePhoto,
                role = initialRole,
                district = "नई दिल्ली",
                coins = 0
            )
            Result.success(created)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.WRITE, path)
            Result.failure(e)
        }
    }

    fun observeUserProfile(uid: String): Flow<UserProfile?> =
        db.collection("users")
            .document(uid)
            .snapshots()
            .map { snapshot ->
                snapshot.toObject(
                    UserProfile::class.java,
                    DocumentSnapshot.ServerTimestampBehavior.ESTIMATE
                )
            }

    fun observeAllUsersForMasterAdmin(): Flow<List<UserProfile>> =
        db.collection("users")
            .orderBy("updatedAt", Query.Direction.DESCENDING)
            .snapshots()
            .map { querySnapshot ->
                querySnapshot.documents.mapNotNull { doc ->
                    doc.toObject(
                        UserProfile::class.java,
                        DocumentSnapshot.ServerTimestampBehavior.ESTIMATE
                    )
                }
            }

    fun observePublishedArticles(): Flow<List<NewsArticle>> =
        db.collection("articles")
            .whereEqualTo("status", ArticleStatus.PUBLISHED.name)
            .snapshots()
            .map { querySnapshot ->
                querySnapshot.documents.mapNotNull { doc ->
                    doc.toObject(
                        NewsArticle::class.java,
                        DocumentSnapshot.ServerTimestampBehavior.ESTIMATE
                    )
                }.sortedByDescending { it.createdAt?.seconds ?: 0L }
            }

    fun observePublishedEpaperEditions(): Flow<List<EpaperEdition>> =
        db.collection("epaperEditions")
            .whereEqualTo("status", "PUBLISHED")
            .snapshots()
            .map { querySnapshot ->
                val list = querySnapshot.documents.mapNotNull { doc ->
                    try {
                        val id = doc.id
                        val city = doc.getString("cityOrEdition") ?: doc.getString("title") ?: doc.getString("districtName") ?: "दैनिक ई-पेपर"
                        val state = doc.getString("state") ?: "मध्य प्रदेश"
                        val date = doc.getString("editionDate") ?: doc.getString("publicationDate") ?: ""
                        val pages = (doc.getLong("pagesCount") ?: doc.getLong("totalPages") ?: 12L).toInt()
                        val lead = doc.getString("leadHeadline") ?: doc.getString("title") ?: ""
                        val summary = doc.getString("leadSummary") ?: ""
                        val sec = doc.getString("secondHeadline") ?: ""
                        val third = doc.getString("thirdHeadline") ?: ""
                        val pdf = doc.getString("pdfUrl") ?: "/api/v1/epaper/editions/$id/export/pdf"
                        val thumb = doc.getString("thumbnailUrl") ?: doc.getString("coverImageUrl") ?: "/api/v1/epaper/editions/$id/pages/1/export/png"
                        EpaperEdition(
                            id = id,
                            cityOrEdition = city,
                            state = state,
                            editionDate = date,
                            pagesCount = pages,
                            leadHeadline = lead,
                            leadSummary = summary,
                            secondHeadline = sec,
                            thirdHeadline = third,
                            pdfUrl = pdf,
                            thumbnailUrl = thumb,
                            totalPages = pages,
                            status = "PUBLISHED"
                        )
                    } catch (e: Exception) {
                        null
                    }
                }
                if (list.isEmpty()) {
                    SeedNewsData.epaperEditions
                } else {
                    list
                }
            }

    fun observeMyArticles(uid: String): Flow<List<NewsArticle>> =
        db.collection("articles")
            .whereEqualTo("authorId", uid)
            .snapshots()
            .map { querySnapshot ->
                querySnapshot.documents.mapNotNull { doc ->
                    doc.toObject(
                        NewsArticle::class.java,
                        DocumentSnapshot.ServerTimestampBehavior.ESTIMATE
                    )
                }.sortedByDescending { it.updatedAt?.seconds ?: 0L }
            }

    fun observePendingArticlesForAdmin(): Flow<List<NewsArticle>> =
        db.collection("articles")
            .whereEqualTo("status", ArticleStatus.PENDING_VERIFICATION.name)
            .snapshots()
            .map { querySnapshot ->
                querySnapshot.documents.mapNotNull { doc ->
                    doc.toObject(
                        NewsArticle::class.java,
                        DocumentSnapshot.ServerTimestampBehavior.ESTIMATE
                    )
                }.sortedByDescending { it.updatedAt?.seconds ?: 0L }
            }

    fun observeBookmarks(uid: String): Flow<List<BookmarkItem>> =
        db.collection("users")
            .document(uid)
            .collection("bookmarks")
            .orderBy("createdAt", Query.Direction.DESCENDING)
            .snapshots()
            .map { querySnapshot ->
                querySnapshot.documents.mapNotNull { doc ->
                    doc.toObject(
                        BookmarkItem::class.java,
                        DocumentSnapshot.ServerTimestampBehavior.ESTIMATE
                    )
                }
            }

    suspend fun toggleBookmark(article: NewsArticle, currentlyBookmarked: Boolean): Result<Boolean> {
        val uid = try {
            requireUid()
        } catch (e: Exception) {
            return Result.failure(e)
        }
        val safeDocId = article.id.replace(Regex("[^a-zA-Z0-9_\\-]"), "_").take(120)
        val path = "users/$uid/bookmarks/$safeDocId"
        return try {
            val docRef = db.collection("users")
                .document(uid)
                .collection("bookmarks")
                .document(safeDocId)

            if (currentlyBookmarked) {
                docRef.delete().await()
                Result.success(false)
            } else {
                val payload = mutableMapOf<String, Any?>(
                    "userId" to uid,
                    "articleId" to article.id.take(128),
                    "articleTitle" to article.title.ifBlank { "समाचार" }.take(300),
                    "articleCategory" to article.category.take(50),
                    "articleDistrict" to article.district.take(100),
                    "articleImageUrl" to article.imageUrl?.take(1000),
                    "createdAt" to FieldValue.serverTimestamp()
                ).filterValues { it != null }
                docRef.set(payload).await()
                Result.success(true)
            }
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.WRITE, path)
            Result.failure(e)
        }
    }

    suspend fun updatePreferredDistrict(district: String): Result<Unit> {
        val uid = try {
            requireUid()
        } catch (e: Exception) {
            return Result.failure(e)
        }
        val cleanDistrict = district.trim().take(100).ifBlank { "नई दिल्ली" }
        val path = "users/$uid"
        return try {
            db.collection("users")
                .document(uid)
                .update(
                    mapOf(
                        "district" to cleanDistrict,
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, path)
            Result.failure(e)
        }
    }

    suspend fun updateUserRoleByAdmin(
        targetUid: String,
        newRole: UserRole
    ): Result<Unit> {
        val path = "users/$targetUid"
        return try {
            requireUid()
            db.collection("users")
                .document(targetUid)
                .update(
                    mapOf(
                        "role" to newRole.name,
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, path)
            Result.failure(e)
        }
    }

    suspend fun submitArticle(
        title: String,
        summary: String,
        content: String,
        category: String,
        district: String,
        authorProfile: UserProfile,
        publishImmediatelyIfAdmin: Boolean,
        breaking: Boolean,
        live: Boolean,
        aiScore: Int?
    ): Result<String> {
        val uid = try {
            requireUid()
        } catch (e: Exception) {
            return Result.failure(e)
        }

        val cleanTitle = title.trim()
        val cleanContent = content.trim()
        val cleanSummary = summary.trim().ifBlank { cleanContent.take(180) }
        val cleanCategory = category.trim().ifBlank { "राष्ट्रीय" }.take(50)
        val cleanDistrict = district.trim().ifBlank { "नई दिल्ली" }.take(100)
        val cleanState = NewsTaxonomy.stateForDistrict(cleanDistrict).take(100)

        if (cleanTitle.length < 5) {
            return Result.failure(IllegalArgumentException("हेडलाइन कम से कम 5 अक्षरों की होनी चाहिए।"))
        }
        if (cleanContent.length < 10) {
            return Result.failure(IllegalArgumentException("समाचार विवरण कम से कम 10 अक्षरों का होना चाहिए।"))
        }

        val docRef = db.collection("articles").document()
        val isAdmin = authorProfile.userRole == UserRole.ADMIN ||
            isMasterAdminUser(FirebaseAuth.getInstance().currentUser)

        val targetStatus = if (isAdmin && publishImmediatelyIfAdmin) {
            ArticleStatus.PUBLISHED.name
        } else {
            ArticleStatus.PENDING_VERIFICATION.name
        }

        val allowedAuthorRole = if (isAdmin) UserRole.ADMIN.name else UserRole.REPORTER.name
        val allowedBreaking = isAdmin && breaking
        val allowedLive = isAdmin && live

        val path = "articles/${docRef.id}"
        return try {
            val payload = mutableMapOf<String, Any?>(
                "title" to cleanTitle.take(300),
                "summary" to cleanSummary.take(1000),
                "content" to cleanContent.take(50000),
                "category" to cleanCategory,
                "district" to cleanDistrict,
                "state" to cleanState,
                "authorId" to uid,
                "authorName" to authorProfile.displayName.ifBlank { "संवाददाता" }.take(100),
                "authorRole" to allowedAuthorRole,
                "status" to targetStatus,
                "breaking" to allowedBreaking,
                "live" to allowedLive,
                "viewCount" to 0,
                "aiScore" to aiScore?.coerceIn(0, 100),
                "createdAt" to FieldValue.serverTimestamp(),
                "updatedAt" to FieldValue.serverTimestamp()
            ).filterValues { it != null }

            docRef.set(payload).await()
            Result.success(docRef.id)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, path)
            Result.failure(e)
        }
    }

    suspend fun moderateArticle(
        articleId: String,
        newStatus: ArticleStatus,
        breaking: Boolean,
        live: Boolean,
        editorialNote: String?,
        aiScore: Int?
    ): Result<Unit> {
        val path = "articles/$articleId"
        return try {
            requireUid()
            val payload = mutableMapOf<String, Any?>(
                "status" to newStatus.name,
                "breaking" to (newStatus == ArticleStatus.PUBLISHED && breaking),
                "live" to (newStatus == ArticleStatus.PUBLISHED && live),
                "editorialNote" to editorialNote?.trim()?.take(1000),
                "aiScore" to aiScore?.coerceIn(0, 100),
                "updatedAt" to FieldValue.serverTimestamp()
            ).filterValues { it != null }

            db.collection("articles")
                .document(articleId)
                .update(payload)
                .await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, path)
            Result.failure(e)
        }
    }

    suspend fun incrementArticleViewCount(article: NewsArticle) {
        if (article.isSeedArticle || article.status != ArticleStatus.PUBLISHED.name) return
        val path = "articles/${article.id}"
        try {
            db.collection("articles")
                .document(article.id)
                .update("viewCount", FieldValue.increment(1L))
                .await()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, path)
        }
    }
}
