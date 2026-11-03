package com.breakingnewswala.firebase

import com.google.firebase.Timestamp
import com.google.firebase.firestore.DocumentId
import com.google.firebase.firestore.IgnoreExtraProperties
import com.google.firebase.firestore.ServerTimestamp

@IgnoreExtraProperties
data class UserFirestoreModel(
    @DocumentId val id: String = "",
    val displayName: String = "",
    val email: String = "",
    val photoUrl: String = "",
    val role: String = "READER",
    val district: String = "",
    val division: String = "",
    val state: String = "Madhya Pradesh",
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

@IgnoreExtraProperties
data class ArticleFirestoreModel(
    @DocumentId val id: String = "",
    val title: String = "",
    val excerpt: String = "",
    val content: String = "",
    val category: String = "स्थानीय",
    val district: String = "भोपाल",
    val division: String = "भोपाल",
    val state: String = "Madhya Pradesh",
    val authorId: String = "",
    val authorName: String = "",
    val authorRole: String = "REPORTER",
    val status: String = "PUBLISHED",
    val imageUrl: String = "",
    val isBreaking: Boolean = false,
    val isLive: Boolean = false,
    val viewCount: Long = 0L,
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

@IgnoreExtraProperties
data class BookmarkFirestoreModel(
    @DocumentId val id: String = "",
    val userId: String = "",
    val articleId: String = "",
    val articleTitle: String = "",
    val articleCategory: String = "",
    val articleDistrict: String = "",
    val articleImageUrl: String = "",
    @ServerTimestamp val savedAt: Timestamp? = null
)
