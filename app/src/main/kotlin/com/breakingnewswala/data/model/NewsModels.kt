package com.breakingnewswala.data.model

import androidx.annotation.Keep
import com.google.firebase.Timestamp
import com.google.firebase.firestore.DocumentId
import com.google.firebase.firestore.IgnoreExtraProperties

enum class UserRole(val labelHi: String) {
    READER("पाठक"),
    REPORTER("संवाददाता"),
    ADMIN("मास्टर एडमिन");

    companion object {
        fun fromRaw(raw: String?): UserRole =
            entries.firstOrNull { it.name == raw } ?: READER
    }
}

enum class ArticleStatus(val labelHi: String) {
    DRAFT("ड्राफ्ट"),
    PENDING_VERIFICATION("सत्यापन लंबित"),
    PUBLISHED("प्रकाशित"),
    REJECTED("अस्वीकृत");

    companion object {
        fun fromRaw(raw: String?): ArticleStatus =
            entries.firstOrNull { it.name == raw } ?: PUBLISHED
    }
}

@Keep
@IgnoreExtraProperties
data class UserProfile(
    @DocumentId val id: String = "",
    val uid: String = "",
    val email: String = "",
    val displayName: String = "",
    val photoUrl: String? = null,
    val role: String = UserRole.READER.name,
    val district: String = "नई दिल्ली",
    val coins: Int = 0,
    val createdAt: Timestamp? = null,
    val updatedAt: Timestamp? = null
) {
    val userRole: UserRole
        get() = UserRole.fromRaw(role)
}

@Keep
@IgnoreExtraProperties
data class BookmarkItem(
    @DocumentId val id: String = "",
    val userId: String = "",
    val articleId: String = "",
    val articleTitle: String = "",
    val articleCategory: String = "",
    val articleDistrict: String = "",
    val articleImageUrl: String? = null,
    val createdAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class NewsArticle(
    @DocumentId val id: String = "",
    val title: String = "",
    val summary: String = "",
    val content: String = "",
    val category: String = "राष्ट्रीय",
    val district: String = "नई दिल्ली",
    val state: String = "भारत",
    val authorId: String = "",
    val authorName: String = "",
    val authorRole: String = UserRole.REPORTER.name,
    val status: String = ArticleStatus.PUBLISHED.name,
    val imageUrl: String? = null,
    val breaking: Boolean = false,
    val live: Boolean = false,
    val viewCount: Int = 0,
    val editorialNote: String? = null,
    val aiScore: Int? = null,
    val createdAt: Timestamp? = null,
    val updatedAt: Timestamp? = null
) {
    val articleStatus: ArticleStatus
        get() = ArticleStatus.fromRaw(status)

    val isSeedArticle: Boolean
        get() = id.startsWith("seed_")
}

data class EpaperEdition(
    val id: String,
    val cityOrEdition: String,
    val state: String,
    val editionDate: String,
    val pagesCount: Int,
    val leadHeadline: String,
    val leadSummary: String,
    val secondHeadline: String,
    val thirdHeadline: String
)

object NewsTaxonomy {
    val categories = listOf(
        "सभी",
        "ब्रेकिंग",
        "राष्ट्रीय",
        "राजनीति",
        "विकास",
        "रोजगार",
        "अपराध",
        "खेल",
        "तकनीक",
        "स्थानीय"
    )

    val districts = listOf(
        "सभी जिले",
        "नई दिल्ली",
        "भोपाल",
        "इंदौर",
        "जबलपुर",
        "ग्वालियर",
        "उज्जैन",
        "लखनऊ",
        "जयपुर",
        "पटना",
        "मुंबई",
        "रायपुर"
    )

    fun stateForDistrict(district: String): String = when (district) {
        "नई दिल्ली" -> "दिल्ली (राष्ट्रीय)"
        "भोपाल", "इंदौर", "जबलपुर", "ग्वालियर", "उज्जैन" -> "मध्य प्रदेश"
        "लखनऊ" -> "उत्तर प्रदेश"
        "जयपुर" -> "राजस्थान"
        "पटना" -> "बिहार"
        "मुंबई" -> "महाराष्ट्र"
        "रायपुर" -> "छत्तीसगढ़"
        else -> "भारत"
    }
}
