package com.breakingnewswala.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
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
import com.breakingnewswala.viewmodel.ReporterViewModel

enum class ReporterTab {
    COMPOSE,
    HISTORY,
    FEEDBACK
}

@Composable
fun ReporterDeskScreen(
    viewModel: ReporterViewModel,
    onBackClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    var activeTab by remember { mutableStateOf(ReporterTab.COMPOSE) }

    // Form inputs state
    var headline by remember { mutableStateOf("") }
    var summaryLead by remember { mutableStateOf("") }
    var bodyContent by remember { mutableStateOf("") }
    var selectedCategoryId by remember { mutableStateOf("cat-mp") }
    var selectedDistrictId by remember { mutableStateOf("dist-bhopal") }
    var isBreakingNews by remember { mutableStateOf(false) }
    var isSelfVerified by remember { mutableStateOf(false) }
    var showSuccessDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            BnwTopBar(
                title = "संवाददाता फील्ड डेस्क",
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
            // 1. Reporter Identity & Trust Score Header
            Surface(
                color = Color(0xFF0F172A),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = uiState.reporterName,
                                color = Color.White,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "बीट: ${uiState.reporterDistrict} • ${uiState.reporterRole}",
                                color = Color(0xFF94A3B8),
                                fontSize = 12.sp
                            )
                        }

                        // Trust Score Pill
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color(0xFF166534))
                                .padding(horizontal = 10.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = "★ विश्वास स्कोर: ${uiState.trustScore}%",
                                color = Color.White,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Metric Counters
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        StatPill("प्रस्तुत", "${uiState.submittedCount}", Color(0xFF38BDF8), Modifier.weight(1f))
                        StatPill("समीक्षाधीन", "${uiState.pendingReviewCount}", Color(0xFFFDE047), Modifier.weight(1f))
                        StatPill("प्रकाशित", "${uiState.publishedCount}", Color(0xFF4ADE80), Modifier.weight(1f))
                        StatPill("संशोधन", "${uiState.revisionCount}", Color(0xFFF87171), Modifier.weight(1f))
                    }
                }
            }

            // 2. Desk Navigation Tabs
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.White)
                    .padding(horizontal = 8.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.SpaceAround
            ) {
                DeskTabButton(
                    title = "✍️ नया समाचार",
                    isSelected = activeTab == ReporterTab.COMPOSE,
                    onClick = { activeTab = ReporterTab.COMPOSE }
                )
                DeskTabButton(
                    title = "📋 मेरी खबरें (${uiState.myArticles.size})",
                    isSelected = activeTab == ReporterTab.HISTORY,
                    onClick = { activeTab = ReporterTab.HISTORY }
                )
                DeskTabButton(
                    title = "💬 फीडबैक (${uiState.feedbackList.size})",
                    isSelected = activeTab == ReporterTab.FEEDBACK,
                    onClick = { activeTab = ReporterTab.FEEDBACK }
                )
            }

            HorizontalDivider(color = BnwBorder)

            // 3. Tab Contents
            when (activeTab) {
                ReporterTab.COMPOSE -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState())
                            .padding(16.dp)
                    ) {
                        Text(
                            text = "फील्ड समाचार ड्राफ्ट तैयार करें",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = BnwTextPrimary
                        )
                        Text(
                            text = "प्रामाणिक साक्ष्य, प्राथमिक स्रोत और सटीक तथ्यों के साथ सूचना दर्ज करें।",
                            fontSize = 12.sp,
                            color = BnwTextSecondary
                        )

                        // AI Assistant Banner Card
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = Color(0xFFF0FDF4),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFBBF7D0)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text("✨", fontSize = 15.sp)
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            text = "Gemini AI रिपोर्टर सहायक",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 12.sp,
                                            color = Color(0xFF15803D)
                                        )
                                    }

                                    Button(
                                        onClick = {
                                            val sourceNotes = if (bodyContent.isNotBlank()) bodyContent else headline
                                            viewModel.assistDraftWithAi(sourceNotes, "निवाड़ी / भोपाल") { draft ->
                                                if (headline.isBlank()) headline = draft.suggestedHeadline
                                                if (summaryLead.isBlank()) summaryLead = draft.leadParagraph
                                            }
                                        },
                                        enabled = !uiState.isAiAssisting && (headline.isNotBlank() || bodyContent.isNotBlank()),
                                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF16A34A)),
                                        shape = RoundedCornerShape(6.dp),
                                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                                        modifier = Modifier.height(30.dp)
                                    ) {
                                        Text("हेडलाइन व ड्राफ्ट सुझाएं", fontSize = 10.sp, color = Color.White, fontWeight = FontWeight.Bold)
                                    }
                                }

                                if (uiState.isAiAssisting) {
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        CircularProgressIndicator(modifier = Modifier.size(14.dp), strokeWidth = 2.dp, color = Color(0xFF16A34A))
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("Gemini 3.8 Flash द्वारा तथ्य और आकर्षक शीर्षक विश्लेषित हो रहे हैं...", fontSize = 11.sp, color = Color(0xFF166534))
                                    }
                                }

                                if (uiState.aiAssistanceError != null) {
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text("⚠️ ${uiState.aiAssistanceError}", fontSize = 11.sp, color = BnwRed)
                                }

                                uiState.latestAiDraft?.let { draft ->
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text("सुझावित शीर्षक: ${draft.suggestedHeadline}", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF14532D))
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text("सुझावित लीड: ${draft.leadParagraph}", fontSize = 11.sp, color = Color(0xFF1E293B))
                                    if (draft.factCheckGuidance.isNotEmpty()) {
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text("📌 फील्ड सत्यापन सुझाव: ${draft.factCheckGuidance.joinToString(" • ")}", fontSize = 10.sp, color = Color(0xFF854D0E))
                                    }
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        // Headline Field
                        OutlinedTextField(
                            value = headline,
                            onValueChange = { headline = it },
                            label = { Text("समाचार शीर्षक (Headline) *") },
                            placeholder = { Text("उदा. भोपाल: तालाब संरक्षण परियोजना पर निर्णय...") },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(8.dp)
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        // Summary Field
                        OutlinedTextField(
                            value = summaryLead,
                            onValueChange = { summaryLead = it },
                            label = { Text("संक्षिप्त विवरण (Summary / Lead Excerpt)") },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(8.dp)
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        // Full Article Body
                        OutlinedTextField(
                            value = bodyContent,
                            onValueChange = { bodyContent = it },
                            label = { Text("विस्तृत समाचार सामग्री (Full Story) *") },
                            placeholder = { Text("स्थान, समय, प्रत्यक्षदर्शियों के बयान, प्रशासन की प्रतिक्रिया...") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(160.dp),
                            shape = RoundedCornerShape(8.dp)
                        )

                        Spacer(modifier = Modifier.height(14.dp))

                        // Category & District Selectors
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text("श्रेणी:", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = BnwTextPrimary)
                                Spacer(modifier = Modifier.height(4.dp))
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(Color(0xFFF1F5F9))
                                        .padding(horizontal = 10.dp, vertical = 8.dp)
                                ) {
                                    Text("मध्य प्रदेश समाचार", fontSize = 12.sp, color = BnwTextPrimary)
                                }
                            }
                            Column(modifier = Modifier.weight(1f)) {
                                Text("जिला बीट:", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = BnwTextPrimary)
                                Spacer(modifier = Modifier.height(4.dp))
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(Color(0xFFF1F5F9))
                                        .padding(horizontal = 10.dp, vertical = 8.dp)
                                ) {
                                    Text("निवाड़ी (Niwari)", fontSize = 12.sp, color = BnwTextPrimary)
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        // Breaking News Toggle Switch
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color(0xFFFEF2F2))
                                .padding(horizontal = 12.dp, vertical = 8.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text("🚨 क्या यह अति-महत्वपूर्ण ब्रेकिंग न्यूज़ है?", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = BnwRed)
                                Text("अति आवश्यक घटनाओं को टिकर पर तुरंत प्रसारित करने हेतु", fontSize = 11.sp, color = Color(0xFF7F1D1D))
                            }
                            Switch(
                                checked = isBreakingNews,
                                onCheckedChange = { isBreakingNews = it },
                                colors = SwitchDefaults.colors(checkedThumbColor = BnwRed, checkedTrackColor = BnwLightRed)
                            )
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        // Self Verification Checkbox
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Checkbox(
                                checked = isSelfVerified,
                                onCheckedChange = { isSelfVerified = it },
                                colors = CheckboxDefaults.colors(checkedColor = BnwRed)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "मैं प्रमाणित करता/करती हूँ कि समाचार के सभी तथ्य जमीनी स्तर पर सत्यापित हैं तथा किसी भी समुदाय के प्रति द्वेषपूर्ण नहीं हैं।",
                                fontSize = 11.sp,
                                color = BnwTextSecondary,
                                lineHeight = 16.sp
                            )
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // Submit Button
                        Button(
                            onClick = {
                                if (headline.isNotBlank() && bodyContent.isNotBlank() && isSelfVerified) {
                                    viewModel.submitArticle(
                                        title = headline,
                                        excerpt = summaryLead,
                                        content = bodyContent,
                                        categoryId = selectedCategoryId,
                                        districtId = selectedDistrictId,
                                        isBreaking = isBreakingNews,
                                        onSuccess = {
                                            headline = ""
                                            summaryLead = ""
                                            bodyContent = ""
                                            isSelfVerified = false
                                            showSuccessDialog = true
                                        }
                                    )
                                }
                            },
                            enabled = headline.isNotBlank() && bodyContent.isNotBlank() && isSelfVerified && !uiState.isSubmitting,
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = BnwRed),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            if (uiState.isSubmitting) {
                                CircularProgressIndicator(color = Color.White, modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("संपादकीय डेस्क को प्रेषित हो रहा है...")
                            } else {
                                Icon(Icons.Default.Send, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("संपादकीय डेस्क को भेजें (Submit to Newsroom)")
                            }
                        }

                        if (showSuccessDialog) {
                            Spacer(modifier = Modifier.height(12.dp))
                            Surface(
                                color = Color(0xFFDCFCE7),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    text = "✅ ${uiState.submissionSuccessMessage}",
                                    color = Color(0xFF166534),
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    modifier = Modifier.padding(12.dp)
                                )
                            }
                        }
                    }
                }

                ReporterTab.HISTORY -> {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        items(uiState.myArticles, key = { it.id }) { article ->
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(8.dp),
                                colors = CardDefaults.cardColors(containerColor = Color.White),
                                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                            ) {
                                Column(modifier = Modifier.padding(14.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        StatusBadge(status = article.status)
                                        Text(
                                            text = article.publishedAt ?: article.createdAt ?: "",
                                            fontSize = 11.sp,
                                            color = BnwTextTertiary
                                        )
                                    }

                                    Spacer(modifier = Modifier.height(8.dp))

                                    Text(
                                        text = article.title,
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = BnwTextPrimary
                                    )

                                    val summaryText = article.summary
                                    if (!summaryText.isNullOrBlank()) {
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(
                                            text = summaryText,
                                            fontSize = 12.sp,
                                            color = BnwTextSecondary,
                                            maxLines = 2
                                        )
                                    }

                                    Spacer(modifier = Modifier.height(8.dp))

                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = "📍 ${article.districtName ?: "मध्य प्रदेश"}",
                                            fontSize = 12.sp,
                                            color = BnwBlue,
                                            fontWeight = FontWeight.SemiBold
                                        )
                                        Text(
                                            text = "दृश्य: ${article.viewCount}",
                                            fontSize = 11.sp,
                                            color = BnwTextTertiary
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                ReporterTab.FEEDBACK -> {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(uiState.feedbackList, key = { it.id }) { fb ->
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(8.dp),
                                colors = CardDefaults.cardColors(containerColor = Color.White),
                                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                            ) {
                                Column(modifier = Modifier.padding(14.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = fb.reviewerName,
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = BnwTextPrimary
                                        )
                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(4.dp))
                                                .background(if (fb.decision == "APPROVED") Color(0xFFDCFCE7) else Color(0xFFFFEDD5))
                                                .padding(horizontal = 8.dp, vertical = 2.dp)
                                        ) {
                                            Text(
                                                text = if (fb.decision == "APPROVED") "स्वीकृत" else "संशोधन अपेक्षित",
                                                color = if (fb.decision == "APPROVED") Color(0xFF166534) else Color(0xFFC2410C),
                                                fontSize = 10.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(6.dp))

                                    Text(
                                        text = fb.comments,
                                        fontSize = 13.sp,
                                        color = Color(0xFF334155),
                                        lineHeight = 20.sp
                                    )

                                    Spacer(modifier = Modifier.height(8.dp))

                                    Text(
                                        text = fb.createdAt,
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
}

@Composable
fun StatPill(
    label: String,
    value: String,
    accentColor: Color,
    modifier: Modifier = Modifier
) {
    Surface(
        color = Color(0xFF1E293B),
        shape = RoundedCornerShape(6.dp),
        modifier = modifier
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(value, fontSize = 16.sp, fontWeight = FontWeight.Black, color = accentColor)
            Text(label, fontSize = 10.sp, color = Color(0xFF94A3B8))
        }
    }
}

@Composable
fun DeskTabButton(
    title: String,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(6.dp))
            .background(if (isSelected) BnwRed else Color.Transparent)
            .clickable(onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 8.dp)
    ) {
        Text(
            text = title,
            color = if (isSelected) Color.White else BnwTextSecondary,
            fontSize = 13.sp,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
        )
    }
}
