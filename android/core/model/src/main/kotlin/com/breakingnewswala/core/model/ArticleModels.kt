package com.breakingnewswala.core.model

import kotlinx.serialization.Serializable

@Serializable
enum class ArticleStatus {
    DRAFT,
    PENDING_REVIEW,
    UNDER_REVIEW,
    REVISION_REQUESTED,
    REJECTED,
    PUBLISHED,
    ARCHIVED,
    RETRACTED
}

@Serializable
data class ArticleItem(
    val id: String,
    val slug: String,
    val title: String,
    val summary: String? = null,
    val content: String? = null,
    val status: ArticleStatus = ArticleStatus.PUBLISHED,
    val featuredImage: String? = null,
    val categoryId: String? = null,
    val categoryName: String? = null,
    val districtId: String? = null,
    val districtName: String? = null,
    val divisionId: String? = null,
    val authorId: String? = null,
    val authorName: String? = null,
    val isBreaking: Boolean = false,
    val viewCount: Long = 0,
    val publishedAt: String? = null,
    val createdAt: String? = null
)

@Serializable
data class ArticleDetail(
    val id: String,
    val slug: String,
    val title: String,
    val summary: String? = null,
    val content: String,
    val status: ArticleStatus,
    val featuredImage: String? = null,
    val imageCaption: String? = null,
    val imageAttribution: String? = null,
    val categoryId: String? = null,
    val categoryName: String? = null,
    val districtId: String? = null,
    val districtName: String? = null,
    val authorId: String,
    val authorName: String,
    val authorRole: String? = null,
    val isBreaking: Boolean = false,
    val viewCount: Long = 0,
    val shareCount: Long = 0,
    val publishedAt: String? = null,
    val createdAt: String,
    val relatedArticles: List<ArticleItem> = emptyList(),
    val tags: List<String> = emptyList()
)

@Serializable
data class CreateDraftRequest(
    val title: String,
    val content: String,
    val bodyContent: String = content,
    val summary: String? = null,
    val excerpt: String? = summary,
    val categoryId: String,
    val primaryCategoryId: String = categoryId,
    val subcategoryId: String? = null,
    val divisionId: String? = null,
    val districtId: String,
    val primaryLocationId: String = districtId,
    val featuredImageId: String? = null,
    val featuredMediaId: String? = featuredImageId,
    val imageCaption: String? = null,
    val imageAttribution: String? = null,
    val sourceAttribution: String? = imageAttribution,
    val isBreaking: Boolean = false
)

@Serializable
data class UpdateDraftRequest(
    val title: String? = null,
    val content: String? = null,
    val bodyContent: String? = content,
    val summary: String? = null,
    val excerpt: String? = summary,
    val categoryId: String? = null,
    val primaryCategoryId: String? = categoryId,
    val subcategoryId: String? = null,
    val divisionId: String? = null,
    val districtId: String? = null,
    val primaryLocationId: String? = districtId,
    val featuredImageId: String? = null,
    val featuredMediaId: String? = featuredImageId,
    val imageCaption: String? = null,
    val imageAttribution: String? = null,
    val sourceAttribution: String? = imageAttribution,
    val isBreaking: Boolean? = null
)

@Serializable
data class EditorialFeedbackItem(
    val id: String,
    val articleId: String,
    val reviewerName: String,
    val reviewerRole: String,
    val decision: String,
    val comments: String,
    val createdAt: String
)

@Serializable
data class ArticleRevisionItem(
    val id: String,
    val articleId: String,
    val revisionNumber: Int,
    val title: String,
    val diffSummary: String? = null,
    val createdAt: String
)

