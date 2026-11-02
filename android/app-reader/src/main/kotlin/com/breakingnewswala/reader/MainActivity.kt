package com.breakingnewswala.reader

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.breakingnewswala.core.designsystem.theme.BnwTheme
import com.breakingnewswala.reader.ui.*
import com.breakingnewswala.reader.viewmodel.*

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val app = application as ReaderApplication

        // Factory viewmodels
        val homeViewModel = HomeViewModel(
            newsApi = app.newsApi,
            categoryApi = app.categoryApi,
            territoryApi = app.territoryApi,
            monetizationApi = app.monetizationApi,
            analyticsTracker = app.analyticsTracker
        )

        val articleDetailViewModel = ArticleDetailViewModel(
            newsApi = app.newsApi,
            analyticsTracker = app.analyticsTracker
        )

        val searchViewModel = SearchViewModel(
            newsApi = app.newsApi,
            analyticsTracker = app.analyticsTracker
        )

        val epaperViewModel = EpaperViewModel(
            epaperApi = app.epaperApi,
            analyticsTracker = app.analyticsTracker
        )

        // Parse incoming deep link if opened via URL
        val initialDeepLinkArticleId = extractArticleIdFromIntent(intent)

        setContent {
            BnwTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    ReaderAppNavHost(
                        homeViewModel = homeViewModel,
                        articleDetailViewModel = articleDetailViewModel,
                        searchViewModel = searchViewModel,
                        epaperViewModel = epaperViewModel,
                        initialArticleId = initialDeepLinkArticleId,
                        onShare = { title, url ->
                            val sendIntent = Intent().apply {
                                action = Intent.ACTION_SEND
                                putExtra(Intent.EXTRA_TEXT, "$title\n$url")
                                type = "text/plain"
                            }
                            startActivity(Intent.createChooser(sendIntent, "साझा करें"))
                        }
                    )
                }
            }
        }
    }

    private fun extractArticleIdFromIntent(intent: Intent?): String? {
        val uri: Uri? = intent?.data
        if (uri != null) {
            if (uri.scheme == "bnw" && uri.host == "article") {
                return uri.lastPathSegment
            }
            if (uri.scheme == "https" && uri.host == "breakingnewswala.com" && uri.path?.startsWith("/article/") == true) {
                return uri.lastPathSegment
            }
        }
        return null
    }
}

@Composable
fun ReaderAppNavHost(
    homeViewModel: HomeViewModel,
    articleDetailViewModel: ArticleDetailViewModel,
    searchViewModel: SearchViewModel,
    epaperViewModel: EpaperViewModel,
    initialArticleId: String? = null,
    onShare: (String, String) -> Unit
) {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = if (initialArticleId != null) {
            ReaderDestinations.articleDetailRoute(initialArticleId)
        } else {
            ReaderDestinations.HOME
        }
    ) {
        composable(ReaderDestinations.HOME) {
            HomeScreen(
                viewModel = homeViewModel,
                onArticleClick = { articleId ->
                    navController.navigate(ReaderDestinations.articleDetailRoute(articleId))
                },
                onSearchClick = { navController.navigate(ReaderDestinations.SEARCH) },
                onNotificationsClick = { navController.navigate(ReaderDestinations.PROFILE) },
                onEpaperClick = { navController.navigate(ReaderDestinations.EPAPER) },
                onShareArticle = { articleId ->
                    onShare("ब्रेकिंग न्यूज़ वाला", "https://breakingnewswala.com/article/$articleId")
                }
            )
        }

        composable(
            route = ReaderDestinations.ARTICLE_DETAIL,
            arguments = listOf(navArgument("articleId") { type = NavType.StringType })
        ) { backStackEntry ->
            val articleId = backStackEntry.arguments?.getString("articleId") ?: ""
            ArticleDetailScreen(
                articleId = articleId,
                viewModel = articleDetailViewModel,
                onBackClick = { navController.popBackStack() },
                onShareClick = onShare,
                onRelatedArticleClick = { nextArticleId ->
                    navController.navigate(ReaderDestinations.articleDetailRoute(nextArticleId))
                }
            )
        }

        composable(ReaderDestinations.SEARCH) {
            SearchScreen(
                viewModel = searchViewModel,
                onArticleClick = { articleId ->
                    navController.navigate(ReaderDestinations.articleDetailRoute(articleId))
                },
                onBackClick = { navController.popBackStack() }
            )
        }

        composable(ReaderDestinations.EPAPER) {
            EpaperScreen(
                viewModel = epaperViewModel,
                onBackClick = { navController.popBackStack() }
            )
        }

        composable(ReaderDestinations.PROFILE) {
            ProfileScreen(
                onBackClick = { navController.popBackStack() }
            )
        }
    }
}
