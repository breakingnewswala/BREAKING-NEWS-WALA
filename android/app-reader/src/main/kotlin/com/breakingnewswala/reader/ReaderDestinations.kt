package com.breakingnewswala.reader

object ReaderDestinations {
    const val HOME = "home"
    const val BREAKING = "breaking"
    const val CATEGORIES = "categories"
    const val DISTRICTS = "districts"
    const val ARTICLE_DETAIL = "article/{articleId}"
    const val SEARCH = "search"
    const val VIDEO = "video"
    const val EPAPER = "epaper"
    const val BOOKMARKS = "bookmarks"
    const val PROFILE = "profile"

    fun articleDetailRoute(articleId: String): String = "article/$articleId"
}

