package com.breakingnewswala.reporter.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.breakingnewswala.core.designsystem.components.*
import com.breakingnewswala.core.designsystem.theme.*
import com.breakingnewswala.core.model.ArticleStatus
import com.breakingnewswala.reporter.viewmodel.ArticleHistoryViewModel

@Composable
fun ArticleHistoryScreen(
    viewModel: ArticleHistoryViewModel,
    onBackClick: () -> Unit,
    onEditArticle: (String) -> Unit,
    onViewFeedback: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            BnwTopBar(
                title = "मेरी प्रविष्टियां (My Submissions)",
                onBackClick = onBackClick
            )
        },
        modifier = modifier
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(Color(0xFFF8FAFC))
        ) {
            // Status Filter Chips
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState())
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                FilterChip(
                    label = "सभी",
                    isSelected = uiState.selectedStatus == null,
                    onClick = { viewModel.loadArticles(null) }
                )
                FilterChip(
                    label = "ड्राफ्ट",
                    isSelected = uiState.selectedStatus == ArticleStatus.DRAFT,
                    onClick = { viewModel.loadArticles(ArticleStatus.DRAFT) }
                )
                FilterChip(
                    label = "समीक्षा लंबित",
                    isSelected = uiState.selectedStatus == ArticleStatus.PENDING_REVIEW,
                    onClick = { viewModel.loadArticles(ArticleStatus.PENDING_REVIEW) }
                )
                FilterChip(
                    label = "संशोधन अपेक्षित",
                    isSelected = uiState.selectedStatus == ArticleStatus.REVISION_REQUESTED,
                    onClick = { viewModel.loadArticles(ArticleStatus.REVISION_REQUESTED) }
                )
                FilterChip(
                    label = "प्रकाशित",
                    isSelected = uiState.selectedStatus == ArticleStatus.PUBLISHED,
                    onClick = { viewModel.loadArticles(ArticleStatus.PUBLISHED) }
                )
                FilterChip(
                    label = "अस्वीकृत",
                    isSelected = uiState.selectedStatus == ArticleStatus.REJECTED,
                    onClick = { viewModel.loadArticles(ArticleStatus.REJECTED) }
                )
            }

            if (uiState.isLoading) {
                LoadingIndicator(message = "समाचार प्रविष्टियां लोड हो रही हैं...")
            } else if (uiState.articles.isEmpty()) {
                EmptyStateView(
                    title = "कोई समाचार प्रविष्टि नहीं मिली",
                    subtitle = "इस स्थिति में कोई समाचार रिकॉर्ड उपलब्ध नहीं है।"
                )
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(12.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(uiState.articles, key = { it.id }) { article ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    if (article.status == ArticleStatus.DRAFT || article.status == ArticleStatus.REVISION_REQUESTED) {
                                        onEditArticle(article.id)
                                    } else {
                                        onViewFeedback(article.id)
                                    }
                                },
                            shape = RoundedCornerShape(8.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White)
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = article.districtName ?: "मध्य प्रदेश",
                                        fontSize = 11.sp,
                                        color = BnwBlue,
                                        fontWeight = FontWeight.Bold
                                    )
                                    StatusBadge(status = article.status)
                                }

                                Spacer(modifier = Modifier.height(6.dp))

                                Text(
                                    text = article.title,
                                    style = MaterialTheme.typography.titleMedium,
                                    color = BnwTextPrimary,
                                    maxLines = 2
                                )

                                Spacer(modifier = Modifier.height(8.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = article.publishedAt ?: article.createdAt ?: "",
                                        fontSize = 11.sp,
                                        color = BnwTextTertiary
                                    )

                                    if (article.status == ArticleStatus.REVISION_REQUESTED || article.status == ArticleStatus.REJECTED) {
                                        TextButton(onClick = { onViewFeedback(article.id) }) {
                                            Text("संपादकीय टिप्पणी देखें", fontSize = 12.sp, color = BnwRed)
                                        }
                                    } else if (article.status == ArticleStatus.DRAFT) {
                                        TextButton(onClick = { onEditArticle(article.id) }) {
                                            Text("संपादित करें", fontSize = 12.sp, color = BnwBlue)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

