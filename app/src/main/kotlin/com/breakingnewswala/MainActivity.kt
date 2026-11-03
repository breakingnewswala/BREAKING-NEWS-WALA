package com.breakingnewswala

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.EditNote
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.breakingnewswala.core.designsystem.theme.BnwBlue
import com.breakingnewswala.core.designsystem.theme.BnwRed
import com.breakingnewswala.core.designsystem.theme.BnwTheme
import com.breakingnewswala.ui.*
import com.breakingnewswala.viewmodel.*

object Destinations {
    const val HOME = "home"
    const val ARTICLE_DETAIL = "article/{articleId}"
    const val SEARCH = "search"
    const val EPAPER = "epaper"
    const val DESK = "desk"
    const val PROFILE = "profile"

    fun articleDetailRoute(articleId: String): String = "article/$articleId"
}

enum class MainBottomTab(
    val route: String,
    val titleHi: String,
    val icon: ImageVector
) {
    HOME(Destinations.HOME, "होम", Icons.Default.Home),
    SEARCH(Destinations.SEARCH, "खोज", Icons.Default.Search),
    EPAPER(Destinations.EPAPER, "ई-पेपर", Icons.Default.Description),
    DESK(Destinations.DESK, "डेस्क", Icons.Default.EditNote),
    PROFILE(Destinations.PROFILE, "प्रोफ़ाइल", Icons.Default.Person)
}

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Mandatory Firebase App Check initialization before UI or ViewModels
        com.breakingnewswala.firebase.configureAppCheck(this, intent)

        val app = application as BnwApplication

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

        val reporterViewModel = ReporterViewModel(
            authRepository = app.authRepository,
            newsApi = app.newsApi,
            categoryApi = app.categoryApi,
            territoryApi = app.territoryApi
        )

        val newsroomViewModel = NewsroomViewModel()

        val initialDeepLinkArticleId = extractArticleIdFromIntent(intent)

        setContent {
            BnwTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    BnwMainNavigation(
                        homeViewModel = homeViewModel,
                        articleDetailViewModel = articleDetailViewModel,
                        searchViewModel = searchViewModel,
                        epaperViewModel = epaperViewModel,
                        reporterViewModel = reporterViewModel,
                        newsroomViewModel = newsroomViewModel,
                        initialArticleId = initialDeepLinkArticleId,
                        onShare = { title, url ->
                            val sendIntent = Intent().apply {
                                action = Intent.ACTION_SEND
                                putExtra(Intent.EXTRA_TEXT, "$title\n$url")
                                type = "text/plain"
                            }
                            startActivity(Intent.createChooser(sendIntent, "साझा करें (Share Story)"))
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
fun BnwMainNavigation(
    homeViewModel: HomeViewModel,
    articleDetailViewModel: ArticleDetailViewModel,
    searchViewModel: SearchViewModel,
    epaperViewModel: EpaperViewModel,
    reporterViewModel: ReporterViewModel,
    newsroomViewModel: NewsroomViewModel,
    initialArticleId: String? = null,
    onShare: (String, String) -> Unit
) {
    val navController = rememberNavController()
    var currentRole by remember { mutableStateOf(AppRole.READER) }
    val homeUiState by homeViewModel.uiState.collectAsState()

    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    val isDetailScreen = currentRoute?.startsWith("article/") == true

    Scaffold(
        bottomBar = {
            if (!isDetailScreen) {
                NavigationBar(
                    containerColor = Color.White,
                    tonalElevation = 6.dp
                ) {
                    MainBottomTab.entries.forEach { tab ->
                        val isSelected = currentRoute == tab.route
                        NavigationBarItem(
                            selected = isSelected,
                            onClick = {
                                if (currentRoute != tab.route) {
                                    navController.navigate(tab.route) {
                                        popUpTo(Destinations.HOME) {
                                            saveState = true
                                        }
                                        launchSingleTop = true
                                        restoreState = true
                                    }
                                }
                            },
                            icon = {
                                Icon(
                                    imageVector = tab.icon,
                                    contentDescription = tab.titleHi
                                )
                            },
                            label = {
                                Text(
                                    text = tab.titleHi,
                                    fontSize = 11.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                                )
                            },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = BnwRed,
                                selectedTextColor = BnwRed,
                                indicatorColor = Color(0xFFFEE2E2),
                                unselectedIconColor = Color(0xFF64748B),
                                unselectedTextColor = Color(0xFF64748B)
                            )
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = if (initialArticleId != null) {
                Destinations.articleDetailRoute(initialArticleId)
            } else {
                Destinations.HOME
            },
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(Destinations.HOME) {
                HomeScreen(
                    viewModel = homeViewModel,
                    onArticleClick = { articleId ->
                        navController.navigate(Destinations.articleDetailRoute(articleId))
                    },
                    onSearchClick = { navController.navigate(Destinations.SEARCH) },
                    onProfileClick = { navController.navigate(Destinations.PROFILE) },
                    onShareArticle = { articleId ->
                        onShare("BREAKING NEWS WALA", "https://breakingnewswala.com/article/$articleId")
                    }
                )
            }

            composable(
                route = Destinations.ARTICLE_DETAIL,
                arguments = listOf(navArgument("articleId") { type = NavType.StringType })
            ) { backStackEntry ->
                val articleId = backStackEntry.arguments?.getString("articleId") ?: ""
                ArticleDetailScreen(
                    articleId = articleId,
                    viewModel = articleDetailViewModel,
                    onBackClick = { navController.popBackStack() },
                    onShareClick = onShare,
                    onRelatedArticleClick = { nextArticleId ->
                        navController.navigate(Destinations.articleDetailRoute(nextArticleId))
                    }
                )
            }

            composable(Destinations.SEARCH) {
                SearchScreen(
                    viewModel = searchViewModel,
                    onArticleClick = { articleId ->
                        navController.navigate(Destinations.articleDetailRoute(articleId))
                    },
                    onBackClick = { navController.navigate(Destinations.HOME) }
                )
            }

            composable(Destinations.EPAPER) {
                EpaperScreen(
                    viewModel = epaperViewModel,
                    onBackClick = { navController.navigate(Destinations.HOME) }
                )
            }

            composable(Destinations.DESK) {
                RoleAwareDeskScreen(
                    currentRole = currentRole,
                    onRoleChange = { newRole -> currentRole = newRole },
                    reporterViewModel = reporterViewModel,
                    newsroomViewModel = newsroomViewModel,
                    onBackClick = { navController.navigate(Destinations.HOME) }
                )
            }

            composable(Destinations.PROFILE) {
                ProfileScreen(
                    userCoins = homeUiState.userCoins,
                    bookmarkedCount = homeUiState.bookmarkedArticleIds.size,
                    currentRole = currentRole,
                    onRoleChange = { newRole -> currentRole = newRole },
                    onBackClick = { navController.navigate(Destinations.HOME) }
                )
            }
        }
    }
}

@Composable
fun RoleAwareDeskScreen(
    currentRole: AppRole,
    onRoleChange: (AppRole) -> Unit,
    reporterViewModel: ReporterViewModel,
    newsroomViewModel: NewsroomViewModel,
    onBackClick: () -> Unit
) {
    var previewMode by remember { mutableStateOf("reporter") }

    Column(modifier = Modifier.fillMaxSize()) {
        // Top Role Indicator & Quick Switcher Strip
        Surface(
            color = Color(0xFF0F172A),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = when (currentRole) {
                            AppRole.READER -> "प्रेस कार्यक्षेत्र (पाठक पूर्वावलोकन मोड)"
                            AppRole.REPORTER -> "संवाददाता अधिकृत डेस्क"
                            AppRole.ADMIN -> "मुख्य संपादक व एडमिन डेस्क"
                        },
                        color = Color.White,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )

                    // Quick Toggle for testing between Reporter and Newsroom
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(4.dp))
                                .background(if (previewMode == "reporter") BnwRed else Color(0xFF334155))
                                .clickable { previewMode = "reporter" }
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = "संवाददाता",
                                color = Color.White,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(4.dp))
                                .background(if (previewMode == "newsroom") BnwBlue else Color(0xFF334155))
                                .clickable { previewMode = "newsroom" }
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = "न्यूज़रूम एडमिन",
                                color = Color.White,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }

                if (currentRole == AppRole.READER) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "ℹ️ आप पाठक मोड में हैं। मास्टर एडमिन द्वारा अधिकृत होने पर रिपोर्टर डेस्क सीधे अनलॉक होता है। नीचे लाइव पूर्वावलोकन उपलब्ध है:",
                        color = Color(0xFFCBD5E1),
                        fontSize = 10.sp,
                        lineHeight = 14.sp
                    )
                }
            }
        }

        // Render Desk according to active role or preview selection
        val effectiveDesk = when (currentRole) {
            AppRole.REPORTER -> "reporter"
            AppRole.ADMIN -> "newsroom"
            AppRole.READER -> previewMode
        }

        if (effectiveDesk == "reporter") {
            ReporterDeskScreen(
                viewModel = reporterViewModel,
                onBackClick = onBackClick
            )
        } else {
            NewsroomDeskScreen(
                viewModel = newsroomViewModel,
                onBackClick = onBackClick
            )
        }
    }
}

