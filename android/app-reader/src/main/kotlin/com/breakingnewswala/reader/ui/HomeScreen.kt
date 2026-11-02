package com.breakingnewswala.reader.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.breakingnewswala.core.designsystem.components.*
import com.breakingnewswala.reader.viewmodel.HomeViewModel

@Composable
fun HomeScreen(
    viewModel: HomeViewModel,
    onArticleClick: (String) -> Unit,
    onSearchClick: () -> Unit,
    onNotificationsClick: () -> Unit,
    onEpaperClick: () -> Unit,
    onShareArticle: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            BnwMasthead(
                onSearchClick = onSearchClick,
                onNotificationsClick = onNotificationsClick
            )
        },
        modifier = modifier
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(Color(0xFFF8FAFC)),
            contentPadding = PaddingValues(bottom = 24.dp)
        ) {
            // 1. Breaking News Ticker
            val topBreaking = uiState.breakingArticles.firstOrNull()
            if (topBreaking != null) {
                item {
                    BreakingNewsTicker(
                        headline = topBreaking.title,
                        districtName = topBreaking.districtName,
                        onClick = { onArticleClick(topBreaking.id) }
                    )
                }
            }

            // 2. Category Filter Row
            if (uiState.categories.isNotEmpty()) {
                item {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState())
                            .padding(horizontal = 12.dp, vertical = 8.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        FilterChip(
                            label = "सभी",
                            isSelected = uiState.selectedCategoryId == null,
                            onClick = { viewModel.selectCategory(null) }
                        )
                        uiState.categories.forEach { category ->
                            FilterChip(
                                label = category.nameHi,
                                isSelected = uiState.selectedCategoryId == category.id,
                                onClick = { viewModel.selectCategory(category.id) }
                            )
                        }
                    }
                }
            }

            // 3. District Filter Row (Madhya Pradesh Districts)
            if (uiState.districts.isNotEmpty()) {
                item {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState())
                            .padding(horizontal = 12.dp, vertical = 4.dp),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        FilterChip(
                            label = "पूरा मप्र",
                            isSelected = uiState.selectedDistrictId == null,
                            onClick = { viewModel.selectDistrict(null) }
                        )
                        uiState.districts.forEach { district ->
                            FilterChip(
                                label = district.nameHi,
                                isSelected = uiState.selectedDistrictId == district.id,
                                onClick = { viewModel.selectDistrict(district.id) }
                            )
                        }
                    }
                }
            }

            // 4. Header ASCI Ad Banner (if available)
            uiState.activeAd?.let { ad ->
                item {
                    Box(modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)) {
                        AscAdBanner(
                            creativeUrl = ad.creativeUrl,
                            isSponsored = ad.isSponsored,
                            advertiserName = ad.advertiserName
                        )
                    }
                }
            }

            // 5. Loading Indicator
            if (uiState.isLoading && uiState.latestArticles.isEmpty()) {
                item {
                    LoadingIndicator(message = "ताज़ा समाचार लोड हो रहे हैं...")
                }
            }

            // 6. Error State
            if (!uiState.errorMessage.isNullOrBlank() && uiState.latestArticles.isEmpty()) {
                item {
                    ErrorView(
                        message = uiState.errorMessage ?: "त्रुटि",
                        onRetry = { viewModel.loadHomeData() }
                    )
                }
            }

            // 7. Empty State
            if (!uiState.isLoading && uiState.latestArticles.isEmpty() && uiState.errorMessage == null) {
                item {
                    EmptyStateView(
                        title = "कोई समाचार उपलब्ध नहीं है",
                        subtitle = "कृपया अन्य ज़िले या श्रेणी का चयन करें।"
                    )
                }
            }

            // 8. Latest News Feed List
            items(uiState.latestArticles, key = { it.id }) { article ->
                Box(modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)) {
                    NewsCard(
                        title = article.title,
                        summary = article.summary,
                        imageUrl = article.featuredImage,
                        categoryName = article.categoryName,
                        districtName = article.districtName,
                        publishedAt = article.publishedAt,
                        isBreaking = article.isBreaking,
                        onClick = { onArticleClick(article.id) },
                        onShareClick = { onShareArticle(article.id) }
                    )
                }
            }
        }
    }
}

