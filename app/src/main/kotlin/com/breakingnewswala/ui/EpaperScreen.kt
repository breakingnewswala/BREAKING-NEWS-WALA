package com.breakingnewswala.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Download
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
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
import com.breakingnewswala.viewmodel.EpaperViewModel

@Composable
fun EpaperScreen(
    viewModel: EpaperViewModel,
    onBackClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            BnwTopBar(
                title = "दैनिक डिजिटल ई-पेपर",
                onBackClick = onBackClick,
                actions = {
                    IconButton(onClick = { viewModel.downloadEdition() }) {
                        Icon(Icons.Default.Download, contentDescription = "PDF डाउनलोड करें", tint = BnwTextPrimary)
                    }
                }
            )
        },
        bottomBar = {
            uiState.selectedEdition?.let { edition ->
                Surface(
                    color = Color.White,
                    shadowElevation = 8.dp,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Button(
                            onClick = {
                                if (uiState.currentPageIndex > 0) {
                                    viewModel.onPageChanged(uiState.currentPageIndex - 1)
                                }
                            },
                            enabled = uiState.currentPageIndex > 0,
                            colors = ButtonDefaults.buttonColors(containerColor = BnwRed),
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("पिछला पेज")
                        }

                        Text(
                            text = "पृष्ठ ${uiState.currentPageIndex + 1} / ${edition.totalPages}",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            color = BnwTextPrimary
                        )

                        Button(
                            onClick = {
                                if (uiState.currentPageIndex < edition.totalPages - 1) {
                                    viewModel.onPageChanged(uiState.currentPageIndex + 1)
                                }
                            },
                            enabled = uiState.currentPageIndex < edition.totalPages - 1,
                            colors = ButtonDefaults.buttonColors(containerColor = BnwRed),
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Text("अगला पेज")
                            Spacer(modifier = Modifier.width(4.dp))
                            Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, modifier = Modifier.size(16.dp))
                        }
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
                .background(Color(0xFF0F172A))
        ) {
            // Edition Selector Tabs (MP Districts Editions)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState())
                    .padding(horizontal = 12.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                uiState.editions.forEach { edition ->
                    val isSelected = uiState.selectedEdition?.id == edition.id
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(if (isSelected) BnwYellow else Color(0xFF1E293B))
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Text(
                            text = "${edition.title} (${edition.editionDate})",
                            color = if (isSelected) Color.Black else Color.White,
                            fontSize = 12.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                        )
                    }
                }
            }

            // Download Alert
            if (!uiState.downloadSuccessMessage.isNullOrBlank()) {
                Surface(
                    color = Color(0xFF166534),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 4.dp),
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text(
                        text = "📥 ${uiState.downloadSuccessMessage}",
                        color = Color.White,
                        fontSize = 12.sp,
                        modifier = Modifier.padding(8.dp)
                    )
                }
            }

            // E-Paper Page View Canvas
            uiState.selectedEdition?.let { edition ->
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(12.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .fillMaxHeight(),
                        shape = RoundedCornerShape(8.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(12.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            // Newspaper Masthead Bar
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(BnwRed)
                                    .padding(horizontal = 12.dp, vertical = 6.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "BREAKING NEWS WALA • दैनिक ई-पेपर",
                                    color = Color.White,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = edition.editionDate,
                                    color = BnwYellow,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }

                            Spacer(modifier = Modifier.height(10.dp))

                            // Newspaper Page Preview Image
                            AsyncImage(
                                model = edition.thumbnailUrl,
                                contentDescription = "${edition.title} पृष्ठ ${uiState.currentPageIndex + 1}",
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .weight(1f)
                                    .clip(RoundedCornerShape(4.dp)),
                                contentScale = ContentScale.Crop
                            )

                            Spacer(modifier = Modifier.height(8.dp))

                            Text(
                                text = "संस्करणी पृष्ठ ${uiState.currentPageIndex + 1} — ${edition.title}",
                                fontSize = 12.sp,
                                color = BnwTextSecondary,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                }
            }
        }
    }
}
