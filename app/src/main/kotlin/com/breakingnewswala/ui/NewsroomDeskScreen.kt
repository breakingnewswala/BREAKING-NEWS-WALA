package com.breakingnewswala.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.EditNote
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
import com.breakingnewswala.viewmodel.NewsroomViewModel

@Composable
fun NewsroomDeskScreen(
    viewModel: NewsroomViewModel,
    onBackClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    var revisionComments by remember { mutableStateOf("") }
    var showRevisionDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            BnwTopBar(
                title = "सेंट्रल न्यूज़रूम डेस्क (Chief Editor Desk)",
                onBackClick = onBackClick
            )
        },
        modifier = modifier
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(Color(0xFFF1F5F9))
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            // Desk Status Banner
            Surface(
                color = Color(0xFF0F172A),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "संपादकीय सत्यापन व प्रकाशन नियंत्रण",
                            color = Color.White,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "10-बिंदु तथ्य जांच प्रोटोकॉल एवं एआई सहायक",
                            color = Color(0xFF94A3B8),
                            fontSize = 12.sp
                        )
                    }

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(BnwRed)
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = "क्यू: ${uiState.queueArticles.size} लंबित",
                            color = Color.White,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            if (!uiState.actionSuccessMessage.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(12.dp))
                Surface(
                    color = Color(0xFFDCFCE7),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "✅ ${uiState.actionSuccessMessage}",
                        color = Color(0xFF166534),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(12.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Currently Selected Pending Article for Review
            uiState.selectedArticle?.let { article ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "📍 ${article.districtName ?: "मध्य प्रदेश"} • ${article.categoryName ?: "समाचार"}",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = BnwBlue
                            )
                            Text(
                                text = "संवाददाता: ${article.authorName}",
                                fontSize = 12.sp,
                                color = BnwTextSecondary
                            )
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(
                            text = article.title,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = BnwTextPrimary
                        )

                        Spacer(modifier = Modifier.height(6.dp))

                        Text(
                            text = article.content,
                            fontSize = 13.sp,
                            color = Color(0xFF334155),
                            lineHeight = 20.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // AI Newsroom Assistant Card
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFEFF6FF)),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFBFDBFE))
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = BnwBlue, modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "एआई न्यूज़रूम सहायक (AI Assistant)",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = BnwDarkBlue
                                )
                            }

                            Button(
                                onClick = { viewModel.runAiAnalysis() },
                                colors = ButtonDefaults.buttonColors(containerColor = BnwBlue),
                                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                                shape = RoundedCornerShape(6.dp)
                            ) {
                                Text("विश्लेषण करें", fontSize = 11.sp, color = Color.White)
                            }
                        }

                        if (uiState.isAiProcessing) {
                            Spacer(modifier = Modifier.height(10.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                CircularProgressIndicator(color = BnwBlue, modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("देवनागरी व्याकरण व तथ्य विश्लेषण चल रहा है...", fontSize = 11.sp, color = BnwTextSecondary)
                            }
                        }

                        if (!uiState.aiSuggestedHeadline.isNullOrBlank()) {
                            Spacer(modifier = Modifier.height(10.dp))
                            Surface(
                                color = Color.White,
                                shape = RoundedCornerShape(6.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(10.dp)) {
                                    Text("सुझावित देवनागरी शीर्षक:", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = BnwTextSecondary)
                                    Text(uiState.aiSuggestedHeadline ?: "", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = BnwTextPrimary)
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(uiState.aiAnalysisNotes ?: "", fontSize = 11.sp, color = Color(0xFF334155))
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // 10-Point Fact-Checking Protocol
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        val checkedCount = uiState.factCheckPoints.count { it.isChecked }
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "10-बिंदु तथ्य जांच प्रोटोकॉल",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = BnwTextPrimary
                            )
                            Text(
                                text = "$checkedCount / 10 सत्यापित",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (checkedCount == 10) Color(0xFF16A34A) else BnwRed
                            )
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        uiState.factCheckPoints.forEach { point ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { viewModel.toggleFactCheckPoint(point.id) }
                                    .padding(vertical = 4.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Checkbox(
                                    checked = point.isChecked,
                                    onCheckedChange = { viewModel.toggleFactCheckPoint(point.id) },
                                    colors = CheckboxDefaults.colors(checkedColor = BnwRed)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Column {
                                    Text(
                                        text = "${point.id}. ${point.titleHindi}",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = BnwTextPrimary
                                    )
                                    Text(
                                        text = point.descriptionHindi,
                                        fontSize = 10.sp,
                                        color = BnwTextTertiary
                                    )
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Newsroom Action Buttons
                val allVerified = uiState.factCheckPoints.all { it.isChecked }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Button(
                        onClick = {
                            viewModel.approveAndPublish(article.id) {}
                        },
                        enabled = allVerified,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF16A34A)),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Icon(Icons.Default.CheckCircle, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("सत्यापित व प्रकाशित करें", fontSize = 12.sp, color = Color.White)
                    }

                    OutlinedButton(
                        onClick = { showRevisionDialog = true },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Icon(Icons.Default.EditNote, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("संशोधन मांगें", fontSize = 12.sp, color = BnwRed)
                    }
                }
            } ?: run {
                EmptyStateView(
                    title = "संपादकीय समीक्षा कतार रिक्त है",
                    subtitle = "वर्तमान में कोई समाचार सत्यापन हेतु लंबित नहीं है।"
                )
            }
        }
    }

    if (showRevisionDialog) {
        AlertDialog(
            onDismissRequest = { showRevisionDialog = false },
            title = { Text("संवाददाता को संशोधन निर्देश") },
            text = {
                OutlinedTextField(
                    value = revisionComments,
                    onValueChange = { revisionComments = it },
                    placeholder = { Text("किस तथ्य या साक्ष्य में सुधार की आवश्यकता है...") },
                    modifier = Modifier.fillMaxWidth()
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        uiState.selectedArticle?.let {
                            viewModel.requestRevision(it.id, revisionComments) {}
                        }
                        showRevisionDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = BnwRed)
                ) {
                    Text("निर्देश भेजें")
                }
            },
            dismissButton = {
                TextButton(onClick = { showRevisionDialog = false }) {
                    Text("रद्द करें")
                }
            }
        )
    }
}
