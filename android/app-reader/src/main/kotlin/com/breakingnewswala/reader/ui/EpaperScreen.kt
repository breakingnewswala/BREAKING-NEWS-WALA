package com.breakingnewswala.reader.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.breakingnewswala.core.designsystem.components.*
import com.breakingnewswala.core.designsystem.theme.BnwRed
import com.breakingnewswala.core.designsystem.theme.BnwTextPrimary
import com.breakingnewswala.core.pdf.EpaperPageRenderer
import com.breakingnewswala.reader.viewmodel.EpaperViewModel

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
                title = "दैनिक ई-पेपर",
                onBackClick = onBackClick,
                actions = {
                    IconButton(onClick = { viewModel.downloadEdition() }) {
                        Icon(Icons.Default.Download, contentDescription = "डाउनलोड करें", tint = BnwTextPrimary)
                    }
                }
            )
        },
        bottomBar = {
            // Page Navigation Controls
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
                            colors = ButtonDefaults.buttonColors(containerColor = BnwRed)
                        ) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null)
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("पिछला")
                        }

                        Text(
                            text = "पृष्ठ ${uiState.currentPageIndex + 1} / ${edition.totalPages}",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )

                        Button(
                            onClick = {
                                if (uiState.currentPageIndex < edition.totalPages - 1) {
                                    viewModel.onPageChanged(uiState.currentPageIndex + 1)
                                }
                            },
                            enabled = uiState.currentPageIndex < edition.totalPages - 1,
                            colors = ButtonDefaults.buttonColors(containerColor = BnwRed)
                        ) {
                            Text("अगला")
                            Spacer(modifier = Modifier.width(4.dp))
                            Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null)
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
                .background(Color(0xFFF1F5F9))
        ) {
            // Edition Selector Tabs (if multiple editions available)
            if (uiState.editions.size > 1) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState())
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    uiState.editions.forEach { edition ->
                        FilterChip(
                            label = "${edition.title} (${edition.editionDate})",
                            isSelected = uiState.selectedEdition?.id == edition.id,
                            onClick = { viewModel.selectEdition(edition) }
                        )
                    }
                }
            }

            if (uiState.isLoading) {
                LoadingIndicator(message = "ई-पेपर संस्करण लोड हो रहा है...")
            } else if (uiState.selectedEdition == null) {
                EmptyStateView(
                    title = "कोई ई-पेपर संस्करण उपलब्ध नहीं है",
                    subtitle = "कृपया बाद में पुनः प्रयास करें।"
                )
            } else {
                // PDF Viewer
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(8.dp)
                ) {
                    EpaperPageRenderer(
                        bitmap = uiState.renderedPageBitmap,
                        modifier = Modifier.fillMaxSize()
                    )
                }
            }
        }
    }
}

