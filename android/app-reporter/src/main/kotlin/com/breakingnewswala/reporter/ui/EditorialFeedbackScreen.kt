package com.breakingnewswala.reporter.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.breakingnewswala.core.designsystem.components.*
import com.breakingnewswala.core.designsystem.theme.*
import com.breakingnewswala.reporter.viewmodel.ArticleHistoryViewModel

@Composable
fun EditorialFeedbackScreen(
    articleId: String,
    viewModel: ArticleHistoryViewModel,
    onBackClick: () -> Unit,
    onEditArticle: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(articleId) {
        viewModel.loadFeedback(articleId)
    }

    Scaffold(
        topBar = {
            BnwTopBar(
                title = "संपादकीय प्रतिक्रिया (Feedback)",
                onBackClick = onBackClick
            )
        },
        bottomBar = {
            Surface(
                color = Color.White,
                shadowElevation = 8.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Box(modifier = Modifier.padding(16.dp)) {
                    Button(
                        onClick = { onEditArticle(articleId) },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = BnwBlue),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("संशोधन करें (Edit & Resubmit)", color = Color.White, fontWeight = FontWeight.Bold)
                    }
                }
            }
        },
        modifier = modifier
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(Color(0xFFF8FAFC))
                .padding(16.dp)
        ) {
            Text(
                text = "संपादकीय समीक्षा इतिहास",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = BnwTextPrimary
            )
            Spacer(modifier = Modifier.height(12.dp))

            if (uiState.selectedFeedback.isEmpty()) {
                EmptyStateView(
                    title = "कोई विस्तृत टिप्पणी दर्ज नहीं है",
                    subtitle = "संपादक द्वारा कोई लिखित टिप्पणी नहीं दी गई है।"
                )
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(uiState.selectedFeedback, key = { it.id }) { feedback ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(8.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White)
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(
                                        text = "${feedback.reviewerName} (${feedback.reviewerRole})",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp,
                                        color = BnwTextPrimary
                                    )
                                    Text(
                                        text = feedback.decision,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12.sp,
                                        color = if (feedback.decision == "APPROVED") BnwSuccess else BnwError
                                    )
                                }

                                Spacer(modifier = Modifier.height(6.dp))

                                Text(
                                    text = feedback.comments,
                                    fontSize = 13.sp,
                                    color = BnwTextSecondary,
                                    lineHeight = 20.sp
                                )

                                Spacer(modifier = Modifier.height(8.dp))

                                Text(
                                    text = feedback.createdAt,
                                    fontSize = 11.sp,
                                    color = BnwTextTertiary
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

