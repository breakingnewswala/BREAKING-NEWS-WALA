package com.breakingnewswala.reporter

object ReporterDestinations {
    const val LOGIN = "login"
    const val DASHBOARD = "dashboard"
    const val ARTICLE_EDITOR = "editor?articleId={articleId}"
    const val ARTICLE_HISTORY = "history"
    const val EDITORIAL_FEEDBACK = "feedback/{articleId}"
    const val TERRITORY_BEAT = "territory"

    fun editorRoute(articleId: String? = null): String {
        return if (!articleId.isNullOrBlank()) "editor?articleId=$articleId" else "editor"
    }

    fun feedbackRoute(articleId: String): String = "feedback/$articleId"
}

