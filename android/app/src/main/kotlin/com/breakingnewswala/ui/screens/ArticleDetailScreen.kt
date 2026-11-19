package com.breakingnewswala.ui.screens

import android.content.Intent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.BookmarkBorder
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.TextDecrease
import androidx.compose.material.icons.filled.TextIncrease
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.breakingnewswala.ai.AiArticleSummary
import com.breakingnewswala.data.model.NewsArticle
import com.breakingnewswala.ui.theme.BrandBlue
import com.breakingnewswala.ui.theme.BrandRed
import com.breakingnewswala.ui.theme.BrandYellow
import com.breakingnewswala.viewmodel.UiState

@Composable
fun ArticleDetailScreen(
    article: NewsArticle?,
    isBookmarked: Boolean,
    fontScale: Float,
    aiSummaryState: UiState<AiArticleSummary>?,
    onBack: () -> Unit,
    onToggleBookmark: () -> Unit,
    onIncreaseFont: () -> Unit,
    onDecreaseFont: () -> Unit,
    onGenerateAiSummary: () -> Unit,
    onTrackView: (NewsArticle) -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current

    LaunchedEffect(article?.id) {
        if (article != null) {
            onTrackView(article)
        }
    }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        topBar = {
            Surface(
                shadowElevation = 2.dp,
                color = MaterialTheme.colorScheme.surface
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .windowInsetsPadding(WindowInsets.statusBars)
                        .padding(horizontal = 8.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    IconButton(
                        onClick = onBack,
                        modifier = Modifier
                            .size(48.dp)
                            .testTag("article_back_button")
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "वापस जाएं"
                        )
                    }

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        IconButton(
                            onClick = onDecreaseFont,
                            modifier = Modifier
                                .size(48.dp)
                                .testTag("font_decrease_button")
                        ) {
                            Icon(Icons.Default.TextDecrease, contentDescription = "फ़ॉन्ट छोटा करें")
                        }
                        IconButton(
                            onClick = onIncreaseFont,
                            modifier = Modifier
                                .size(48.dp)
                                .testTag("font_increase_button")
                        ) {
                            Icon(Icons.Default.TextIncrease, contentDescription = "फ़ॉन्ट बड़ा करें")
                        }
                        IconButton(
                            onClick = onToggleBookmark,
                            modifier = Modifier
                                .size(48.dp)
                                .testTag("detail_bookmark_button")
                        ) {
                            Icon(
                                imageVector = if (isBookmarked) Icons.Default.Bookmark else Icons.Default.BookmarkBorder,
                                contentDescription = "बुकमार्क",
                                tint = if (isBookmarked) BrandRed else MaterialTheme.colorScheme.onSurface
                            )
                        }
                        if (article != null) {
                            IconButton(
                                onClick = {
                                    val shareIntent = Intent(Intent.ACTION_SEND).apply {
                                        type = "text/plain"
                                        putExtra(Intent.EXTRA_SUBJECT, article.title)
                                        putExtra(
                                            Intent.EXTRA_TEXT,
                                            "${article.title}\n\n${article.summary}\n— ब्रेकिंग न्यूज़ वाला (${article.district})"
                                        )
                                    }
                                    context.startActivity(
                                        Intent.createChooser(shareIntent, "समाचार साझा करें")
                                    )
                                },
                                modifier = Modifier
                                    .size(48.dp)
                                    .testTag("detail_share_button")
                            ) {
                                Icon(Icons.Default.Share, contentDescription = "साझा करें")
                            }
                        }
                    }
                }
            }
        }
    ) { innerPadding ->
        if (article == null) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "यह समाचार उपलब्ध नहीं है।",
                        style = MaterialTheme.typography.titleMedium
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedButton(onClick = onBack) {
                        Text("वापस जाएं")
                    }
                }
            }
        } else {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .navigationBarsPadding(),
                contentAlignment = Alignment.TopCenter
            ) {
                Column(
                    modifier = Modifier
                        .widthIn(max = 680.dp)
                        .fillMaxWidth()
                        .verticalScroll(rememberScrollState())
                        .padding(18.dp)
                ) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        if (article.breaking) {
                            Surface(color = BrandRed, shape = RoundedCornerShape(6.dp)) {
                                Text(
                                    text = "ब्रेकिंग",
                                    color = Color.White,
                                    style = MaterialTheme.typography.labelMedium,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                )
                            }
                        }
                        Surface(
                            color = BrandYellow.copy(alpha = 0.5f),
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Text(
                                text = article.category,
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                        Surface(
                            color = MaterialTheme.colorScheme.secondaryContainer,
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Text(
                                text = "${article.district}, ${article.state}",
                                color = MaterialTheme.colorScheme.onSecondaryContainer,
                                style = MaterialTheme.typography.labelMedium,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Text(
                        text = article.title,
                        style = MaterialTheme.typography.headlineSmall.copy(
                            fontSize = (22f * fontScale).sp,
                            lineHeight = (30f * fontScale).sp
                        ),
                        color = MaterialTheme.colorScheme.onBackground
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = "रिपोर्ट: ${article.authorName} • ${article.viewCount} पाठक",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    // Gemini AI 3-Point Summary Card
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("ai_summary_card"),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = BrandBlue.copy(alpha = 0.07f)
                        )
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Default.AutoAwesome,
                                        contentDescription = null,
                                        tint = BrandBlue,
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = "AI त्वरित 3-पॉइंट सारांश",
                                        style = MaterialTheme.typography.titleMedium,
                                        color = BrandBlue
                                    )
                                }
                                if (aiSummaryState == null || aiSummaryState is UiState.Error) {
                                    Button(
                                        onClick = onGenerateAiSummary,
                                        colors = ButtonDefaults.buttonColors(containerColor = BrandBlue),
                                        shape = RoundedCornerShape(10.dp),
                                        modifier = Modifier.testTag("generate_ai_summary_button")
                                    ) {
                                        Text("सारांश देखें", style = MaterialTheme.typography.labelLarge)
                                    }
                                }
                            }

                            when (aiSummaryState) {
                                is UiState.Loading -> {
                                    Spacer(modifier = Modifier.height(10.dp))
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        CircularProgressIndicator(
                                            color = BrandBlue,
                                            modifier = Modifier.size(18.dp),
                                            strokeWidth = 2.dp
                                        )
                                        Spacer(modifier = Modifier.width(10.dp))
                                        Text(
                                            text = "मुख्य बिंदु तैयार किए जा रहे हैं...",
                                            style = MaterialTheme.typography.bodyMedium
                                        )
                                    }
                                }

                                is UiState.Success -> {
                                    Spacer(modifier = Modifier.height(10.dp))
                                    aiSummaryState.data.bulletPoints.forEachIndexed { idx, bullet ->
                                        Text(
                                            text = "${idx + 1}. $bullet",
                                            style = MaterialTheme.typography.bodyMedium,
                                            modifier = Modifier.padding(vertical = 3.dp)
                                        )
                                    }
                                }

                                is UiState.Error -> {
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = aiSummaryState.message,
                                        color = MaterialTheme.colorScheme.error,
                                        style = MaterialTheme.typography.bodyMedium
                                    )
                                }

                                null -> {
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = "पूरी खबर के 3 मुख्य निष्कर्ष सेकंडों में पढ़ें।",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))
                    HorizontalDivider(color = MaterialTheme.colorScheme.outline)
                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = article.content.ifBlank { article.summary },
                        style = MaterialTheme.typography.bodyLarge.copy(
                            fontSize = (16f * fontScale).sp,
                            lineHeight = (26f * fontScale).sp
                        ),
                        color = MaterialTheme.colorScheme.onBackground
                    )

                    Spacer(modifier = Modifier.height(32.dp))
                }
            }
        }
    }
}
