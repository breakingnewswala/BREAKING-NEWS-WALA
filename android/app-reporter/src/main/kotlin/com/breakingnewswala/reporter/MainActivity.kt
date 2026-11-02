package com.breakingnewswala.reporter

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.breakingnewswala.core.designsystem.theme.BnwTheme
import com.breakingnewswala.reporter.ui.*
import com.breakingnewswala.reporter.viewmodel.*

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val app = application as ReporterApplication

        val authViewModel = ReporterAuthViewModel(app.authRepository)
        val dashboardViewModel = ReporterDashboardViewModel(app.newsApi, app.territoryApi)
        val editorViewModel = ArticleEditorViewModel(
            newsApi = app.newsApi,
            categoryApi = app.categoryApi,
            territoryApi = app.territoryApi,
            mediaUploader = app.mediaUploader
        )
        val historyViewModel = ArticleHistoryViewModel(app.newsApi)

        setContent {
            BnwTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    ReporterAppNavHost(
                        authViewModel = authViewModel,
                        dashboardViewModel = dashboardViewModel,
                        editorViewModel = editorViewModel,
                        historyViewModel = historyViewModel
                    )
                }
            }
        }
    }
}

@Composable
fun ReporterAppNavHost(
    authViewModel: ReporterAuthViewModel,
    dashboardViewModel: ReporterDashboardViewModel,
    editorViewModel: ArticleEditorViewModel,
    historyViewModel: ArticleHistoryViewModel
) {
    val navController = rememberNavController()
    val authState by authViewModel.uiState.collectAsState()

    val startDestination = if (authState.isAuthenticated) {
        ReporterDestinations.DASHBOARD
    } else {
        ReporterDestinations.LOGIN
    }

    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(ReporterDestinations.LOGIN) {
            ReporterLoginScreen(
                viewModel = authViewModel,
                onLoginSuccess = {
                    dashboardViewModel.loadDashboardData()
                    navController.navigate(ReporterDestinations.DASHBOARD) {
                        popUpTo(ReporterDestinations.LOGIN) { inclusive = true }
                    }
                }
            )
        }

        composable(ReporterDestinations.DASHBOARD) {
            ReporterDashboardScreen(
                authViewModel = authViewModel,
                dashboardViewModel = dashboardViewModel,
                onCreateArticleClick = {
                    navController.navigate(ReporterDestinations.editorRoute(null))
                },
                onViewArticleHistoryClick = {
                    historyViewModel.loadArticles(null)
                    navController.navigate(ReporterDestinations.ARTICLE_HISTORY)
                },
                onArticleClick = { articleId ->
                    navController.navigate(ReporterDestinations.editorRoute(articleId))
                }
            )
        }

        composable(
            route = ReporterDestinations.ARTICLE_EDITOR,
            arguments = listOf(navArgument("articleId") {
                type = NavType.StringType
                nullable = true
                defaultValue = null
            })
        ) { backStackEntry ->
            val articleId = backStackEntry.arguments?.getString("articleId")
            ArticleEditorScreen(
                articleId = articleId,
                viewModel = editorViewModel,
                onBackClick = { navController.popBackStack() },
                onSubmitSuccess = {
                    dashboardViewModel.loadDashboardData()
                    navController.popBackStack()
                }
            )
        }

        composable(ReporterDestinations.ARTICLE_HISTORY) {
            ArticleHistoryScreen(
                viewModel = historyViewModel,
                onBackClick = { navController.popBackStack() },
                onEditArticle = { articleId ->
                    navController.navigate(ReporterDestinations.editorRoute(articleId))
                },
                onViewFeedback = { articleId ->
                    navController.navigate(ReporterDestinations.feedbackRoute(articleId))
                }
            )
        }

        composable(
            route = ReporterDestinations.EDITORIAL_FEEDBACK,
            arguments = listOf(navArgument("articleId") { type = NavType.StringType })
        ) { backStackEntry ->
            val articleId = backStackEntry.arguments?.getString("articleId") ?: ""
            EditorialFeedbackScreen(
                articleId = articleId,
                viewModel = historyViewModel,
                onBackClick = { navController.popBackStack() },
                onEditArticle = { id ->
                    navController.navigate(ReporterDestinations.editorRoute(id))
                }
            )
        }
    }
}

