package com.breakingnewswala.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.breakingnewswala.core.designsystem.components.*
import com.breakingnewswala.core.designsystem.theme.*
import com.breakingnewswala.viewmodel.HomeViewModel

enum class AppPortal {
    READER,
    REPORTER,
    NEWSROOM,
    EPAPER
}

@Composable
fun HomeScreen(
    viewModel: HomeViewModel,
    onArticleClick: (String) -> Unit,
    onSearchClick: () -> Unit,
    onProfileClick: () -> Unit,
    onShareArticle: (String) -> Unit,
    currentPortal: AppPortal = AppPortal.READER,
    onPortalChange: (AppPortal) -> Unit = {},
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    var showOnlyBookmarks by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            BnwMasthead(
                onSearchClick = onSearchClick,
                onNotificationsClick = onProfileClick
            )
        },
        modifier = modifier
    ) { paddingValues ->
        val displayedArticles = if (showOnlyBookmarks) {
            uiState.latestArticles.filter { uiState.bookmarkedArticleIds.contains(it.id) }
        } else {
            uiState.latestArticles
        }

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(Color(0xFFF8FAFC)),
            contentPadding = PaddingValues(bottom = 28.dp)
        ) {
            // 1. Live Breaking News Ticker
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
                            label = "सभी श्रेणियां",
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

            // 3. District Filter Row (Madhya Pradesh 55 Districts)
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
                            label = "📍 पूरा मप्र (55 जिले)",
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

            // 4. Bookmarks & Coins Bar
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 6.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (showOnlyBookmarks) "सहेजे गए समाचार (Saved)" else "ताज़ा समाचार प्रवाह",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = BnwTextPrimary
                    )

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        // Reader Coins Pill
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = Color(0xFFFEF9C3),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFDE047))
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("🪙", fontSize = 12.sp)
                                Spacer(modifier = Modifier.width(3.dp))
                                Text(
                                    text = "${uiState.userCoins} सिक्के",
                                    color = Color(0xFF854D0E),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }

                        Spacer(modifier = Modifier.width(8.dp))

                        TextButton(
                            onClick = { showOnlyBookmarks = !showOnlyBookmarks },
                            colors = ButtonDefaults.textButtonColors(
                                contentColor = if (showOnlyBookmarks) BnwRed else BnwTextSecondary
                            )
                        ) {
                            Icon(
                                imageVector = if (showOnlyBookmarks) Icons.Default.Bookmark else Icons.Default.BookmarkBorder,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = if (showOnlyBookmarks) "सभी समाचार" else "बुकमार्क्स (${uiState.bookmarkedArticleIds.size})",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }
            }

            // 5. Loading State
            if (uiState.isLoading && displayedArticles.isEmpty()) {
                item {
                    LoadingIndicator(message = "मध्य प्रदेश के समाचार लोड हो रहे हैं...")
                }
            }

            // 6. Empty State
            if (!uiState.isLoading && displayedArticles.isEmpty()) {
                item {
                    EmptyStateView(
                        title = if (showOnlyBookmarks) "कोई सहेजा गया समाचार नहीं है" else "कोई समाचार उपलब्ध नहीं है",
                        subtitle = "कृपया अन्य ज़िले या श्रेणी का चयन करें।"
                    )
                }
            }

            // 7. News Feed List
            items(displayedArticles, key = { it.id }) { article ->
                val isBookmarked = uiState.bookmarkedArticleIds.contains(article.id)
                Box(modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)) {
                    NewsCard(
                        title = article.title,
                        summary = article.summary,
                        imageUrl = article.featuredImage,
                        categoryName = article.categoryName,
                        districtName = article.districtName,
                        publishedAt = article.publishedAt,
                        isBreaking = article.isBreaking,
                        onClick = {
                            viewModel.earnReadingCoins(5)
                            onArticleClick(article.id)
                        },
                        onShareClick = { onShareArticle(article.id) }
                    )
                }
            }
        }
    }
}

@Composable
fun PortalTabButton(
    title: String,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(6.dp))
            .background(if (isSelected) BnwRed else Color(0xFF1E293B))
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 6.dp)
    ) {
        Text(
            text = title,
            color = if (isSelected) Color.White else Color(0xFFCBD5E1),
            fontSize = 12.sp,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
        )
    }
}
