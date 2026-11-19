package com.breakingnewswala

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.EditNote
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import androidx.navigation.NavDestination.Companion.hasRoute
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.toRoute
import com.breakingnewswala.ai.BnwAiService
import com.breakingnewswala.auth.GoogleAuthManager
import com.breakingnewswala.data.repository.NewsRepository
import com.breakingnewswala.firebase.configureAppCheck
import com.breakingnewswala.ui.components.BrandHeader
import com.breakingnewswala.ui.screens.ArticleDetailScreen
import com.breakingnewswala.ui.screens.AuthScreen
import com.breakingnewswala.ui.screens.DeskScreen
import com.breakingnewswala.ui.screens.EpaperScreen
import com.breakingnewswala.ui.screens.HomeScreen
import com.breakingnewswala.ui.screens.ProfileScreen
import com.breakingnewswala.ui.screens.SearchScreen
import com.breakingnewswala.ui.theme.BrandRed
import com.breakingnewswala.ui.theme.BreakingNewsWalaTheme
import com.breakingnewswala.viewmodel.ArticleDetailViewModel
import com.breakingnewswala.viewmodel.DeskViewModel
import com.breakingnewswala.viewmodel.MainViewModel
import com.breakingnewswala.viewmodel.UiState
import com.google.firebase.auth.FirebaseUser
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable

@Serializable data object HomeRoute
@Serializable data object SearchRoute
@Serializable data object EpaperRoute
@Serializable data object DeskRoute
@Serializable data object ProfileRoute
@Serializable data class ArticleDetailRoute(val articleId: String)

private data class BottomTabItem(
    val route: Any,
    val labelRes: Int,
    val icon: ImageVector,
    val testTag: String
)

private const val MASTER_ADMIN_EMAIL = "breakingnewswala.com@gmail.com"

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // STEP 1: Configure App Check with launch intent BEFORE setContent or ViewModels
        configureAppCheck(this, intent)

        enableEdgeToEdge()

        val authManager = GoogleAuthManager(applicationContext)

        setContent {
            BreakingNewsWalaTheme {
                val currentUser by authManager.authStateFlow()
                    .collectAsStateWithLifecycle(initialValue = null)

                val user = currentUser
                if (user == null) {
                    AuthScreen(authManager = authManager)
                } else {
                    // Key authenticated subtree by uid so account switches cleanly reset ViewModels & listeners
                    key(user.uid) {
                        MainAuthenticatedApp(
                            currentUser = user,
                            authManager = authManager
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun MainAuthenticatedApp(
    currentUser: FirebaseUser,
    authManager: GoogleAuthManager
) {
    val context = LocalContext.current
    val app = context.applicationContext as BnwApplication

    val repository = remember(app.firestoreDatabaseId) {
        NewsRepository(app.firestore)
    }
    val aiService = remember { BnwAiService() }
    val isMasterAdmin = remember(currentUser.email, currentUser.isEmailVerified) {
        currentUser.email.equals(MASTER_ADMIN_EMAIL, ignoreCase = true) && currentUser.isEmailVerified
    }

    val mainViewModel: MainViewModel = viewModel(
        key = "main_${currentUser.uid}",
        factory = viewModelFactory {
            initializer {
                MainViewModel(
                    uid = currentUser.uid,
                    currentUser = currentUser,
                    repository = repository
                )
            }
        }
    )

    val deskViewModel: DeskViewModel = viewModel(
        key = "desk_${currentUser.uid}",
        factory = viewModelFactory {
            initializer {
                DeskViewModel(
                    uid = currentUser.uid,
                    isMasterAdmin = isMasterAdmin,
                    repository = repository,
                    aiService = aiService
                )
            }
        }
    )

    val detailViewModel: ArticleDetailViewModel = viewModel(
        key = "detail_${currentUser.uid}",
        factory = viewModelFactory {
            initializer {
                ArticleDetailViewModel(
                    repository = repository,
                    aiService = aiService
                )
            }
        }
    )

    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = backStackEntry?.destination
    val isDetailRoute = currentDestination?.hasRoute<ArticleDetailRoute>() == true

    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    val userProfileState by mainViewModel.userProfileState.collectAsStateWithLifecycle()
    val feedState by mainViewModel.feedState.collectAsStateWithLifecycle()
    val searchQuery by mainViewModel.searchQuery.collectAsStateWithLifecycle()
    val searchState by mainViewModel.searchResultsState.collectAsStateWithLifecycle()
    val bookmarksState by mainViewModel.bookmarksState.collectAsStateWithLifecycle()
    val statusMessage by mainViewModel.statusMessage.collectAsStateWithLifecycle()

    val myArticlesState by deskViewModel.myArticlesState.collectAsStateWithLifecycle()
    val pendingArticlesState by deskViewModel.pendingArticlesState.collectAsStateWithLifecycle()
    val allUsersState by deskViewModel.allUsersState.collectAsStateWithLifecycle()
    val aiDraftState by deskViewModel.aiDraftState.collectAsStateWithLifecycle()
    val factCheckState by deskViewModel.factCheckState.collectAsStateWithLifecycle()
    val isSubmitting by deskViewModel.isSubmitting.collectAsStateWithLifecycle()
    val deskMessage by deskViewModel.deskMessage.collectAsStateWithLifecycle()

    LaunchedEffect(statusMessage) {
        val msg = statusMessage
        if (!msg.isNullOrBlank()) {
            snackbarHostState.showSnackbar(msg)
            mainViewModel.clearStatusMessage()
        }
    }

    LaunchedEffect(deskMessage) {
        val msg = deskMessage
        if (!msg.isNullOrBlank()) {
            snackbarHostState.showSnackbar(msg)
            deskViewModel.clearDeskMessage()
        }
    }

    val bookmarkedArticleIds = remember(bookmarksState) {
        ((bookmarksState as? UiState.Success)?.data ?: emptyList())
            .map { it.articleId }
            .toSet()
    }

    val tabs = remember {
        listOf(
            BottomTabItem(HomeRoute, R.string.tab_home, Icons.Default.Home, "nav_tab_home"),
            BottomTabItem(SearchRoute, R.string.tab_search, Icons.Default.Search, "nav_tab_search"),
            BottomTabItem(EpaperRoute, R.string.tab_epaper, Icons.Default.MenuBook, "nav_tab_epaper"),
            BottomTabItem(DeskRoute, R.string.tab_desk, Icons.Default.EditNote, "nav_tab_desk"),
            BottomTabItem(ProfileRoute, R.string.tab_profile, Icons.Default.Person, "nav_tab_profile")
        )
    }

    Scaffold(
        snackbarHost = { SnackbarHost(hostState = snackbarHostState) },
        topBar = {
            if (!isDetailRoute) {
                BrandHeader()
            }
        },
        bottomBar = {
            if (!isDetailRoute) {
                NavigationBar(
                    containerColor = MaterialTheme.colorScheme.surface,
                    windowInsets = WindowInsets.navigationBars,
                    modifier = Modifier.testTag("bottom_navigation_bar")
                ) {
                    tabs.forEach { tab ->
                        val selected = when (tab.route) {
                            HomeRoute -> currentDestination?.hasRoute<HomeRoute>() == true
                            SearchRoute -> currentDestination?.hasRoute<SearchRoute>() == true
                            EpaperRoute -> currentDestination?.hasRoute<EpaperRoute>() == true
                            DeskRoute -> currentDestination?.hasRoute<DeskRoute>() == true
                            ProfileRoute -> currentDestination?.hasRoute<ProfileRoute>() == true
                            else -> false
                        }

                        NavigationBarItem(
                            selected = selected,
                            onClick = {
                                navController.navigate(tab.route) {
                                    popUpTo(navController.graph.findStartDestination().id) {
                                        saveState = true
                                    }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = {
                                Icon(
                                    imageVector = tab.icon,
                                    contentDescription = stringResource(tab.labelRes)
                                )
                            },
                            label = {
                                Text(
                                    text = stringResource(tab.labelRes),
                                    style = MaterialTheme.typography.labelMedium
                                )
                            },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = BrandRed,
                                selectedTextColor = BrandRed,
                                indicatorColor = BrandRed.copy(alpha = 0.12f)
                            ),
                            modifier = Modifier.testTag(tab.testTag)
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            NavHost(
                navController = navController,
                startDestination = HomeRoute
            ) {
                composable<HomeRoute> {
                    HomeScreen(
                        feedState = feedState,
                        bookmarkedIds = bookmarkedArticleIds,
                        onSelectCategory = mainViewModel::selectCategory,
                        onSelectDistrict = mainViewModel::selectDistrict,
                        onArticleClick = { id ->
                            detailViewModel.resetSummary()
                            navController.navigate(ArticleDetailRoute(id))
                        },
                        onToggleBookmark = mainViewModel::toggleBookmark
                    )
                }

                composable<SearchRoute> {
                    SearchScreen(
                        query = searchQuery,
                        searchState = searchState,
                        bookmarkedIds = bookmarkedArticleIds,
                        onQueryChange = mainViewModel::updateSearchQuery,
                        onArticleClick = { id ->
                            detailViewModel.resetSummary()
                            navController.navigate(ArticleDetailRoute(id))
                        },
                        onToggleBookmark = mainViewModel::toggleBookmark
                    )
                }

                composable<EpaperRoute> {
                    val epaperUiState by mainViewModel.epaperEditionsState.collectAsStateWithLifecycle()
                    val editions = (epaperUiState as? UiState.Success)?.data ?: mainViewModel.epaperEditions
                    EpaperScreen(editions = editions)
                }

                composable<DeskRoute> {
                    val profile = (userProfileState as? UiState.Success)?.data
                    DeskScreen(
                        userProfile = profile,
                        isMasterAdmin = isMasterAdmin,
                        myArticlesState = myArticlesState,
                        pendingArticlesState = pendingArticlesState,
                        allUsersState = allUsersState,
                        aiDraftState = aiDraftState,
                        factCheckState = factCheckState,
                        isSubmitting = isSubmitting,
                        onGenerateDraft = deskViewModel::generateReporterDraft,
                        onApplyDraft = deskViewModel::clearAiDraft,
                        onSubmitArticle = { title, summary, content, category, district, pub, brk, lv, onDone ->
                            val effectiveProfile = profile ?: return@DeskScreen
                            deskViewModel.submitNewsReport(
                                title = title,
                                summary = summary,
                                content = content,
                                category = category,
                                district = district,
                                profile = effectiveProfile,
                                publishImmediately = pub,
                                breaking = brk,
                                live = lv,
                                onSuccess = onDone
                            )
                        },
                        onRunFactCheck = deskViewModel::runAiFactCheck,
                        onModerateArticle = deskViewModel::moderateArticle,
                        onAssignRole = deskViewModel::assignUserRole
                    )
                }

                composable<ProfileRoute> {
                    ProfileScreen(
                        userProfileState = userProfileState,
                        isMasterAdmin = isMasterAdmin,
                        bookmarksState = bookmarksState,
                        onUpdateDistrict = mainViewModel::updatePreferredDistrict,
                        onBookmarkClick = { id ->
                            detailViewModel.resetSummary()
                            navController.navigate(ArticleDetailRoute(id))
                        },
                        onSignOut = {
                            scope.launch {
                                authManager.signOut()
                            }
                        }
                    )
                }

                composable<ArticleDetailRoute> { entry ->
                    val route = entry.toRoute<ArticleDetailRoute>()
                    val article = mainViewModel.findArticleById(route.articleId)
                    val fontScale by detailViewModel.fontScale.collectAsStateWithLifecycle()
                    val aiSummaryState by detailViewModel.aiSummaryState.collectAsStateWithLifecycle()

                    ArticleDetailScreen(
                        article = article,
                        isBookmarked = article != null && bookmarkedArticleIds.contains(article.id),
                        fontScale = fontScale,
                        aiSummaryState = aiSummaryState,
                        onBack = { navController.popBackStack() },
                        onToggleBookmark = {
                            if (article != null) {
                                mainViewModel.toggleBookmark(
                                    article,
                                    bookmarkedArticleIds.contains(article.id)
                                )
                            }
                        },
                        onIncreaseFont = detailViewModel::increaseFont,
                        onDecreaseFont = detailViewModel::decreaseFont,
                        onGenerateAiSummary = {
                            if (article != null) {
                                detailViewModel.generateSummary(article)
                            }
                        },
                        onTrackView = detailViewModel::trackViewIfNeeded
                    )
                }
            }
        }
    }
}
