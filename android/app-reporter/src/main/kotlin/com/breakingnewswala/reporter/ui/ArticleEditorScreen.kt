package com.breakingnewswala.reporter.ui

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.AddPhotoAlternate
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Save
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.breakingnewswala.core.designsystem.components.BnwTopBar
import com.breakingnewswala.core.designsystem.components.FilterChip
import com.breakingnewswala.core.designsystem.theme.*
import com.breakingnewswala.reporter.viewmodel.ArticleEditorViewModel
import java.io.File
import java.io.FileOutputStream

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ArticleEditorScreen(
    articleId: String?,
    viewModel: ArticleEditorViewModel,
    onBackClick: () -> Unit,
    onSubmitSuccess: () -> Unit,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    LaunchedEffect(articleId) {
        if (!articleId.isNullOrBlank()) {
            viewModel.loadArticleForEditing(articleId)
        }
    }

    LaunchedEffect(uiState.submitSuccess) {
        if (uiState.submitSuccess) {
            onSubmitSuccess()
        }
    }

    // Photo Gallery Launcher
    val galleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri ->
        if (uri != null) {
            try {
                val inputStream = context.contentResolver.openInputStream(uri)
                val tempFile = File(context.cacheDir, "upload_${System.currentTimeMillis()}.jpg")
                val outputStream = FileOutputStream(tempFile)
                inputStream?.copyTo(outputStream)
                inputStream?.close()
                outputStream.close()

                viewModel.uploadMedia(tempFile, "image/jpeg")
            } catch (_: Exception) {}
        }
    }

    Scaffold(
        topBar = {
            BnwTopBar(
                title = if (articleId != null) "समाचार संपादित करें" else "नया समाचार लिखें",
                onBackClick = onBackClick,
                actions = {
                    TextButton(
                        onClick = { viewModel.saveDraft() },
                        enabled = !uiState.isSaving
                    ) {
                        Icon(Icons.Default.Save, contentDescription = null, tint = BnwBlue)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("सहेजें", color = BnwBlue, fontWeight = FontWeight.Bold)
                    }
                }
            )
        },
        bottomBar = {
            Surface(
                color = Color.White,
                shadowElevation = 8.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedButton(
                        onClick = { viewModel.saveDraft() },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("ड्राफ्ट सहेजें", color = BnwTextPrimary)
                    }

                    Button(
                        onClick = { viewModel.submitArticle() },
                        enabled = !uiState.isSubmitting && !uiState.isSaving,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = BnwRed),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        if (uiState.isSubmitting) {
                            CircularProgressIndicator(color = Color.White, strokeWidth = 2.dp, modifier = Modifier.size(18.dp))
                        } else {
                            Icon(Icons.AutoMirrored.Filled.Send, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("जमा करें", fontWeight = FontWeight.Bold, color = Color.White)
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
                .background(Color(0xFFF8FAFC))
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            // Error Message Banner
            if (!uiState.errorMessage.isNullOrBlank()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFFFEE2E2), shape = RoundedCornerShape(6.dp))
                        .padding(12.dp)
                ) {
                    Text(text = uiState.errorMessage ?: "", color = BnwError, fontSize = 13.sp)
                }
                Spacer(modifier = Modifier.height(12.dp))
            }

            // Success Message Banner
            if (!uiState.saveSuccessMessage.isNullOrBlank()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFFDCFCE7), shape = RoundedCornerShape(6.dp))
                        .padding(12.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.CheckCircle, contentDescription = null, tint = BnwSuccess, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(text = uiState.saveSuccessMessage ?: "", color = BnwSuccess, fontSize = 13.sp)
                    }
                }
                Spacer(modifier = Modifier.height(12.dp))
            }

            // 1. Headline (Hindi Devanagari)
            Text(text = "समाचार शीर्षक (Headline) *", fontWeight = FontWeight.Bold, fontSize = 14.sp)
            Spacer(modifier = Modifier.height(4.dp))
            OutlinedTextField(
                value = uiState.title,
                onValueChange = { viewModel.onTitleChange(it) },
                placeholder = { Text("मुख्य खबर का शीर्षक दर्ज करें...") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(8.dp),
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = BnwRed, focusedContainerColor = Color.White, unfocusedContainerColor = Color.White),
                supportingText = {
                    val count = uiState.title.length
                    val isValid = viewModel.isHeadlineValid(uiState.title)
                    Text(
                        text = "$count/150 अक्षर (न्यूनतम 15 आवश्यक, देवनागरी अनिवार्य)",
                        color = if (count == 0 || isValid) BnwTextTertiary else BnwError,
                        fontSize = 11.sp
                    )
                }
            )

            Spacer(modifier = Modifier.height(16.dp))

            // 2. Category Selection
            Text(text = "समाचार श्रेणी (Category) *", fontWeight = FontWeight.Bold, fontSize = 14.sp)
            Spacer(modifier = Modifier.height(6.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                uiState.categories.forEach { category ->
                    FilterChip(
                        label = category.nameHi,
                        isSelected = uiState.selectedCategoryId == category.id,
                        onClick = { viewModel.onCategorySelect(category.id) }
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // 3. District Beat Selection (Strictly Restricted to Reporter's Assigned Beats)
            Text(text = "अधिकृत ज़िला (Assigned Beat) *", fontWeight = FontWeight.Bold, fontSize = 14.sp)
            Spacer(modifier = Modifier.height(6.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                uiState.assignedDistricts.forEach { district ->
                    FilterChip(
                        label = district.nameHi,
                        isSelected = uiState.selectedDistrictId == district.id,
                        onClick = { viewModel.onDistrictSelect(district) }
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // 4. Breaking News Checkbox
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth()
            ) {
                Checkbox(
                    checked = uiState.isBreaking,
                    onCheckedChange = { viewModel.onBreakingToggle(it) },
                    colors = CheckboxDefaults.colors(checkedColor = BnwRed)
                )
                Text(
                    text = "यह अत्यंत महत्वपूर्ण ब्रेकिंग न्यूज़ है (Mark as Breaking)",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = BnwTextPrimary
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // 5. Featured Image & Media Upload
            Text(text = "समाचार छायाचित्र (Photo Attachment)", fontWeight = FontWeight.Bold, fontSize = 14.sp)
            Spacer(modifier = Modifier.height(8.dp))

            if (!uiState.featuredImageUrl.isNullOrBlank()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp)
                        .clip(RoundedCornerShape(8.dp))
                ) {
                    AsyncImage(
                        model = uiState.featuredImageUrl,
                        contentDescription = "अपलोड किया गया छायाचित्र",
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                }
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = uiState.imageCaption,
                    onValueChange = { viewModel.onCaptionChange(it) },
                    placeholder = { Text("फोटो कैप्शन / स्रोत दर्ज करें...") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    colors = OutlinedTextFieldDefaults.colors(focusedContainerColor = Color.White, unfocusedContainerColor = Color.White)
                )
            } else {
                OutlinedButton(
                    onClick = { galleryLauncher.launch("image/*") },
                    enabled = !uiState.isUploading,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Icon(Icons.Default.AddPhotoAlternate, contentDescription = null, tint = BnwRed)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(if (uiState.isUploading) "अपलोड हो रहा है (${uiState.uploadProgress}%)..." else "गैलरी से फोटो चुनें (Max 10MB)")
                }
                if (uiState.isUploading) {
                    Spacer(modifier = Modifier.height(4.dp))
                    LinearProgressIndicator(
                        progress = { uiState.uploadProgress / 100f },
                        modifier = Modifier.fillMaxWidth(),
                        color = BnwRed
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // 6. Article Body Text Area
            Text(text = "समाचार विवरण (Article Body) *", fontWeight = FontWeight.Bold, fontSize = 14.sp)
            Spacer(modifier = Modifier.height(4.dp))
            OutlinedTextField(
                value = uiState.content,
                onValueChange = { viewModel.onContentChange(it) },
                placeholder = { Text("विस्तृत समाचार सामग्री देवनागरी में लिखें...") },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(220.dp),
                shape = RoundedCornerShape(8.dp),
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = BnwRed, focusedContainerColor = Color.White, unfocusedContainerColor = Color.White),
                supportingText = {
                    val words = viewModel.countWords(uiState.content)
                    val chars = uiState.content.trim().length
                    val isValid = viewModel.isBodyContentValid(uiState.content)
                    Text(
                        text = "$words शब्द, $chars अक्षर (न्यूनतम 50 शब्द या 250 अक्षर, अधिकतम 5000 शब्द)",
                        color = if (chars == 0 || isValid) BnwTextTertiary else BnwError,
                        fontSize = 11.sp
                    )
                }
            )
        }
    }
}

