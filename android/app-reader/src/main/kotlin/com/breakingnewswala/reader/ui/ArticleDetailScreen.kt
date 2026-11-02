package com.breakingnewswala.reader.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.BookmarkBorder
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.breakingnewswala.core.designsystem.components.*
import com.breakingnewswala.core.designsystem.theme.*
import com.breakingnewswala.reader.viewmodel.ArticleDetailViewModel

@Composable
fun ArticleDetailScreen(
    articleId: String,
    viewModel: ArticleDetailViewModel,
    onBackClick: () -> Unit,
    onShareClick: (String, String) -> Unit,
    onRelatedArticleClick: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(articleId) {
        viewModel.loadArticle(articleId)
    }

    Scaffold(
        topBar = {
            BnwTopBar(
                title = "समाचार विवरण",
                onBackClick = onBackClick,
                actions = {
                    IconButton(onClick = {
                        uiState.article?.let {
                            viewModel.shareArticle()
                            onShareClick(it.title, "https://breakingnewswala.com/article/${it.slug}")
                        }
                    }) {
                        Icon(Icons.Default.Share, contentDescription = "साझा करें", tint = BnwTextPrimary)
                    }
                    IconButton(onClick = { viewModel.toggleBookmark() }) {
                        Icon(
                            imageVector = if (uiState.isBookmarked) Icons.Default.Bookmark else Icons.Default.BookmarkBorder,
                            contentDescription = "सहेजें",
                            tint = if (uiState.isBookmarked) BnwRed else BnwTextPrimary
                        )
                    }
                }
            )
        },
        modifier = modifier
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(Color.White)
        ) {
            if (uiState.isLoading) {
                LoadingIndicator(message = "समाचार लोड हो रहा है...")
                return@Box
            }

            if (!uiState.errorMessage.isNullOrBlank()) {
                ErrorView(
                    message = uiState.errorMessage ?: "त्रुटि",
                    onRetry = { viewModel.loadArticle(articleId) }
                )
                return@Box
            }

            uiState.article?.let { article ->
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(bottom = 32.dp)
                ) {
                    // 1. Featured Image
                    if (!article.featuredImage.isNullOrBlank()) {
                        AsyncImage(
                            model = article.featuredImage,
                            contentDescription = article.title,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(240.dp),
                            contentScale = ContentScale.Crop
                        )
                        if (!article.imageCaption.isNullOrBlank()) {
                            Text(
                                text = article.imageCaption ?: "",
                                color = BnwTextTertiary,
                                fontSize = 12.sp,
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
                            )
                        }
                    }

                    Column(modifier = Modifier.padding(16.dp)) {
                        // 2. Breaking Badge & Category / District
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            if (article.isBreaking) {
                                Box(
                                    modifier = Modifier
                                        .background(BnwRed, shape = RoundedCornerShape(3.dp))
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text("ब्रेकिंग", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                                Spacer(modifier = Modifier.width(8.dp))
                            }
                            if (!article.categoryName.isNullOrBlank()) {
                                Text(
                                    text = article.categoryName!!.uppercase(),
                                    color = BnwBlue,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            if (!article.districtName.isNullOrBlank()) {
                                Text(" • ", color = Color(0xFF94A3B8), fontSize = 12.sp)
                                Text(article.districtName!!, color = Color(0xFF64748B), fontSize = 12.sp)
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        // 3. Headline (Hindi-first Devanagari)
                        Text(
                            text = article.title,
                            style = MaterialTheme.typography.displayLarge.copy(fontSize = 22.sp),
                            color = BnwTextPrimary
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        // 4. Byline & Publication Date
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "रिपोर्ट: ${article.authorName}",
                                    color = BnwTextPrimary,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Text(
                                    text = article.publishedAt ?: article.createdAt,
                                    color = BnwTextTertiary,
                                    fontSize = 12.sp
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))
                        HorizontalDivider(color = BnwBorder)
                        Spacer(modifier = Modifier.height(16.dp))

                        // 5. Article Body Text
                        Text(
                            text = article.content,
                            style = MaterialTheme.typography.bodyLarge,
                            color = BnwTextPrimary,
                            lineHeight = 28.sp
                        )

                        // 6. Related News Section
                        if (article.relatedArticles.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(24.dp))
                            HorizontalDivider(color = BnwBorder)
                            Spacer(modifier = Modifier.height(16.dp))

                            Text(
                                text = "संबंधित समाचार",
                                style = MaterialTheme.typography.titleLarge,
                                color = BnwTextPrimary
                            )
                            Spacer(modifier = Modifier.height(12.dp))

                            article.relatedArticles.forEach { related ->
                                NewsCard(
                                    title = related.title,
                                    summary = related.summary,
                                    imageUrl = related.featuredImage,
                                    categoryName = related.categoryName,
                                    districtName = related.districtName,
                                    onClick = { onRelatedArticleClick(related.id) },
                                    modifier = Modifier.padding(vertical = 4.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

