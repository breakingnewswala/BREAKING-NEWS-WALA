package com.breakingnewswala.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.BookmarkBorder
import androidx.compose.material.icons.filled.FormatSize
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
import com.breakingnewswala.viewmodel.ArticleDetailViewModel

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
    var showFontSizeMenu by remember { mutableStateOf(false) }

    LaunchedEffect(articleId) {
        viewModel.loadArticle(articleId)
    }

    Scaffold(
        topBar = {
            BnwTopBar(
                title = "समाचार विवरण",
                onBackClick = onBackClick,
                actions = {
                    // Font Size Adjuster Button
                    IconButton(onClick = { showFontSizeMenu = !showFontSizeMenu }) {
                        Icon(Icons.Default.FormatSize, contentDescription = "अक्षर आकार बदलें", tint = BnwTextPrimary)
                    }

                    // Share Button
                    IconButton(onClick = {
                        uiState.article?.let {
                            viewModel.shareArticle()
                            onShareClick(it.title, "https://breakingnewswala.com/article/${it.slug}")
                        }
                    }) {
                        Icon(Icons.Default.Share, contentDescription = "साझा करें", tint = BnwTextPrimary)
                    }

                    // Bookmark Button
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
                    // Font Size Floating Options Menu
                    if (showFontSizeMenu) {
                        Surface(
                            color = Color(0xFFF1F5F9),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 16.dp, vertical = 8.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("फ़ॉन्ट आकार:", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = BnwTextPrimary)
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Button(
                                        onClick = { viewModel.changeFontScale(0.85f) },
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = if (uiState.fontScale == 0.85f) BnwRed else Color.White
                                        ),
                                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp)
                                    ) {
                                        Text("छोटा (A-)", color = if (uiState.fontScale == 0.85f) Color.White else BnwTextPrimary, fontSize = 11.sp)
                                    }
                                    Button(
                                        onClick = { viewModel.changeFontScale(1.0f) },
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = if (uiState.fontScale == 1.0f) BnwRed else Color.White
                                        ),
                                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp)
                                    ) {
                                        Text("सामान्य", color = if (uiState.fontScale == 1.0f) Color.White else BnwTextPrimary, fontSize = 11.sp)
                                    }
                                    Button(
                                        onClick = { viewModel.changeFontScale(1.25f) },
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = if (uiState.fontScale == 1.25f) BnwRed else Color.White
                                        ),
                                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp)
                                    ) {
                                        Text("बड़ा (A+)", color = if (uiState.fontScale == 1.25f) Color.White else BnwTextPrimary, fontSize = 11.sp)
                                    }
                                }
                            }
                        }
                    }

                    // 1. Featured Image
                    if (!article.featuredImage.isNullOrBlank()) {
                        AsyncImage(
                            model = article.featuredImage,
                            contentDescription = article.title,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(230.dp),
                            contentScale = ContentScale.Crop
                        )
                        if (!article.imageCaption.isNullOrBlank()) {
                            Text(
                                text = article.imageCaption ?: "",
                                color = BnwTextTertiary,
                                fontSize = 12.sp,
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp)
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
                                        .padding(horizontal = 8.dp, vertical = 3.dp)
                                ) {
                                    Text("ब्रेकिंग न्यूज़", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
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
                                Text(article.districtName!!, color = Color(0xFF475569), fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        // 3. Headline (Hindi-first Devanagari)
                        val titleSize = (22 * uiState.fontScale).sp
                        Text(
                            text = article.title,
                            fontSize = titleSize,
                            fontWeight = FontWeight.ExtraBold,
                            color = BnwTextPrimary,
                            lineHeight = (titleSize.value * 1.35).sp
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

                        // 5. Coin Rewards Notice
                        Spacer(modifier = Modifier.height(14.dp))
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = Color(0xFFFEF9C3),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFDE047)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("🪙", fontSize = 16.sp)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "इस प्रामाणिक खबर को पढ़ने के लिए आपको +5 पाठक सिक्के प्राप्त हुए हैं!",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = Color(0xFF854D0E)
                                )
                            }
                        }

                        // 5.1. Gemini AI 3-Point Bulletins / Quick Summary
                        Spacer(modifier = Modifier.height(12.dp))
                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = Color(0xFFEFF6FF),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFBFDBFE)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text("✨", fontSize = 16.sp)
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            text = "AI 3-बिंदु त्वरित सार (Gemini Flash)",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 13.sp,
                                            color = Color(0xFF1E40AF)
                                        )
                                    }

                                    if (uiState.aiSummary == null && !uiState.isGeneratingAiSummary) {
                                        Button(
                                            onClick = { viewModel.generateAiSummary() },
                                            colors = ButtonDefaults.buttonColors(containerColor = BnwBlue),
                                            shape = RoundedCornerShape(6.dp),
                                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                                            modifier = Modifier.height(32.dp)
                                        ) {
                                            Text("सारांश निकालें", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }

                                if (uiState.isGeneratingAiSummary) {
                                    Spacer(modifier = Modifier.height(10.dp))
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.padding(vertical = 4.dp)
                                    ) {
                                        CircularProgressIndicator(
                                            modifier = Modifier.size(16.dp),
                                            strokeWidth = 2.dp,
                                            color = BnwBlue
                                        )
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text(
                                            text = "Gemini 3.8 Flash द्वारा विश्लेषण व मुख्य 3 बिंदु तैयार किए जा रहे हैं...",
                                            fontSize = 12.sp,
                                            color = Color(0xFF2563EB)
                                        )
                                    }
                                }

                                if (uiState.aiSummaryError != null) {
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = "⚠️ ${uiState.aiSummaryError}",
                                        color = BnwRed,
                                        fontSize = 12.sp
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    TextButton(
                                        onClick = { viewModel.generateAiSummary() },
                                        contentPadding = PaddingValues(0.dp)
                                    ) {
                                        Text("पुनः प्रयास करें (Retry)", fontSize = 12.sp, color = BnwBlue)
                                    }
                                }

                                if (!uiState.aiSummary.isNullOrBlank()) {
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = uiState.aiSummary!!,
                                        fontSize = 13.sp,
                                        lineHeight = 20.sp,
                                        color = Color(0xFF1E293B)
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))
                        HorizontalDivider(color = BnwBorder)
                        Spacer(modifier = Modifier.height(16.dp))

                        // 6. Article Body Text
                        val bodySize = (16 * uiState.fontScale).sp
                        val bodyLineHeight = (28 * uiState.fontScale).sp
                        Text(
                            text = article.content,
                            fontSize = bodySize,
                            lineHeight = bodyLineHeight,
                            color = Color(0xFF1E293B)
                        )

                        // 7. Tags
                        if (article.tags.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(20.dp))
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .horizontalScroll(rememberScrollState()),
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                article.tags.forEach { tag ->
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(4.dp))
                                            .background(Color(0xFFF1F5F9))
                                            .padding(horizontal = 8.dp, vertical = 4.dp)
                                    ) {
                                        Text("#$tag", color = Color(0xFF475569), fontSize = 12.sp)
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
