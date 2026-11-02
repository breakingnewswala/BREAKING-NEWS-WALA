package com.breakingnewswala.reporter.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.LocationOn
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
import com.breakingnewswala.reporter.viewmodel.ReporterAuthViewModel
import com.breakingnewswala.reporter.viewmodel.ReporterDashboardViewModel

@Composable
fun ReporterDashboardScreen(
    authViewModel: ReporterAuthViewModel,
    dashboardViewModel: ReporterDashboardViewModel,
    onCreateArticleClick: () -> Unit,
    onViewArticleHistoryClick: () -> Unit,
    onArticleClick: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val authState by authViewModel.uiState.collectAsState()
    val dashboardState by dashboardViewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            BnwTopBar(
                title = "रिपोर्टर डैशबोर्ड",
                actions = {
                    IconButton(onClick = { authViewModel.logout() }) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ExitToApp,
                            contentDescription = "लॉगआउट",
                            tint = BnwTextPrimary
                        )
                    }
                }
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = onCreateArticleClick,
                containerColor = BnwRed,
                contentColor = Color.White,
                icon = { Icon(Icons.Default.Add, contentDescription = null) },
                text = { Text("नया समाचार लिखें", fontWeight = FontWeight.Bold) }
            )
        },
        modifier = modifier
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(Color(0xFFF8FAFC)),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // 1. Reporter Identity & Territory Beat Banner
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = authState.user?.fullName ?: "मान्यता प्राप्त रिपोर्टर",
                            style = MaterialTheme.typography.titleLarge,
                            color = BnwTextPrimary
                        )
                        Text(
                            text = "प्रेस आईडी: ${authState.user?.id?.take(8)?.uppercase() ?: "PRESS-ID"}",
                            fontSize = 12.sp,
                            color = BnwTextTertiary
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        // Assigned Territory Beat Badge
                        val primaryBeat = dashboardState.assignments.firstOrNull()
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .background(BnwLightBlue, shape = RoundedCornerShape(6.dp))
                                .padding(horizontal = 10.dp, vertical = 6.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.LocationOn,
                                contentDescription = null,
                                tint = BnwBlue,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "अधिकृत बीट: ${primaryBeat?.districtName ?: primaryBeat?.divisionName ?: "मध्य प्रदेश (क्षेत्रीय)"}",
                                color = BnwBlue,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }
            }

            // 2. Portfolio Metrics Grid
            item {
                Text(
                    text = "समाचार कार्यक्षेत्र सारांश",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = BnwTextPrimary
                )
                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    MetricBox(title = "ड्राफ्ट", count = dashboardState.draftCount, color = Color(0xFF64748B), modifier = Modifier.weight(1f))
                    MetricBox(title = "समीक्षा लंबित", count = dashboardState.pendingReviewCount, color = Color(0xFFD97706), modifier = Modifier.weight(1f))
                    MetricBox(title = "संशोधन अपेक्षित", count = dashboardState.revisionRequestedCount, color = Color(0xFFEA580C), modifier = Modifier.weight(1f))
                    MetricBox(title = "प्रकाशित", count = dashboardState.publishedCount, color = Color(0xFF16A34A), modifier = Modifier.weight(1f))
                }
            }

            // 3. Recent Submissions Section Header
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "हालिया प्रविष्टियां (Recent Submissions)",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = BnwTextPrimary
                    )
                    TextButton(onClick = onViewArticleHistoryClick) {
                        Text("सभी देखें", color = BnwBlue, fontWeight = FontWeight.SemiBold)
                    }
                }
            }

            // 4. Recent Submissions List
            if (dashboardState.isLoading) {
                item { LoadingIndicator(message = "प्रविष्टियां लोड हो रही हैं...") }
            } else if (dashboardState.recentArticles.isEmpty()) {
                item {
                    EmptyStateView(
                        title = "कोई समाचार प्रविष्टि नहीं",
                        subtitle = "नया समाचार लिखने के लिए नीचे दिए गए बटन पर क्लिक करें।"
                    )
                }
            } else {
                items(dashboardState.recentArticles, key = { it.id }) { article ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onArticleClick(article.id) },
                        shape = RoundedCornerShape(8.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = article.title,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp,
                                    color = BnwTextPrimary,
                                    maxLines = 2
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "${article.districtName ?: "मप्र"} • ${article.publishedAt ?: article.createdAt ?: ""}",
                                    fontSize = 11.sp,
                                    color = BnwTextTertiary
                                )
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            StatusBadge(status = article.status)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun MetricBox(
    title: String,
    count: Int,
    color: Color,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Column(
            modifier = Modifier.padding(10.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = count.toString(),
                fontWeight = FontWeight.Black,
                fontSize = 18.sp,
                color = color
            )
            Text(
                text = title,
                fontSize = 10.sp,
                color = BnwTextSecondary,
                maxLines = 1
            )
        }
    }
}

