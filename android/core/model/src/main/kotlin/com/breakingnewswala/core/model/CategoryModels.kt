package com.breakingnewswala.core.model

import kotlinx.serialization.Serializable

@Serializable
data class CategoryItem(
    val id: String,
    val slug: String,
    val nameEn: String,
    val nameHi: String,
    val icon: String? = null,
    val sortOrder: Int = 0,
    val subcategories: List<SubcategoryItem> = emptyList()
)

@Serializable
data class SubcategoryItem(
    val id: String,
    val slug: String,
    val nameEn: String,
    val nameHi: String,
    val categoryId: String
)

