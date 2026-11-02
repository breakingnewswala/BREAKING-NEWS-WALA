package com.breakingnewswala.core.designsystem.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.breakingnewswala.core.designsystem.theme.*
import com.breakingnewswala.core.model.ArticleStatus

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BnwTopBar(
    title: String,
    modifier: Modifier = Modifier,
    onBackClick: (() -> Unit)? = null,
    actions: @Composable RowScope.() -> Unit = {}
) {
    TopAppBar(
        title = {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = BnwTextPrimary
            )
        },
        navigationIcon = {
            if (onBackClick != null) {
                IconButton(onClick = onBackClick) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "पीछे जाएं",
                        tint = BnwTextPrimary
                    )
                }
            }
        },
        actions = actions,
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = Color.White
        ),
        modifier = modifier
    )
}

@Composable
fun LoadingIndicator(
    modifier: Modifier = Modifier,
    message: String? = "लोड हो रहा है..."
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .padding(32.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator(
                color = BnwRed,
                strokeWidth = 3.dp,
                modifier = Modifier.size(36.dp)
            )
            if (message != null) {
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = message,
                    color = BnwTextSecondary,
                    fontSize = 13.sp
                )
            }
        }
    }
}

@Composable
fun ErrorView(
    message: String,
    modifier: Modifier = Modifier,
    onRetry: (() -> Unit)? = null
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(
                text = "समस्या उत्पन्न हुई",
                style = MaterialTheme.typography.titleMedium,
                color = BnwError,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = message,
                style = MaterialTheme.typography.bodyMedium,
                color = BnwTextSecondary,
                textAlign = TextAlign.Center
            )
            if (onRetry != null) {
                Spacer(modifier = Modifier.height(16.dp))
                Button(
                    onClick = onRetry,
                    colors = ButtonDefaults.buttonColors(containerColor = BnwRed),
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text("पुनः प्रयास करें (Retry)", color = Color.White)
                }
            }
        }
    }
}

@Composable
fun EmptyStateView(
    title: String,
    modifier: Modifier = Modifier,
    subtitle: String? = null
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .padding(32.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                color = BnwTextSecondary,
                fontWeight = FontWeight.Bold
            )
            if (subtitle != null) {
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodyMedium,
                    color = BnwTextTertiary,
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}

@Composable
fun FilterChip(
    label: String,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(20.dp))
            .background(if (isSelected) BnwRed else Color(0xFFF1F5F9))
            .clickable(onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 7.dp)
    ) {
        Text(
            text = label,
            color = if (isSelected) Color.White else BnwTextSecondary,
            fontSize = 13.sp,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
        )
    }
}

@Composable
fun StatusBadge(
    status: ArticleStatus,
    modifier: Modifier = Modifier
) {
    val (bgColor, textColor, label) = when (status) {
        ArticleStatus.DRAFT -> Triple(Color(0xFFF1F5F9), Color(0xFF475569), "ड्राफ्ट")
        ArticleStatus.PENDING_REVIEW -> Triple(Color(0xFFFEF3C7), Color(0xFFB45309), "समीक्षा लंबित")
        ArticleStatus.UNDER_REVIEW -> Triple(Color(0xFFDBEAFE), Color(0xFF1D4ED8), "समीक्षाधीन")
        ArticleStatus.REVISION_REQUESTED -> Triple(Color(0xFFFFEDD5), Color(0xFFC2410C), "संशोधन अपेक्षित")
        ArticleStatus.REJECTED -> Triple(Color(0xFFFEE2E2), Color(0xFFB91C1C), "अस्वीकृत")
        ArticleStatus.PUBLISHED -> Triple(Color(0xFFDCFCE7), Color(0xFF15803D), "प्रकाशित")
        ArticleStatus.ARCHIVED -> Triple(Color(0xFFF1F5F9), Color(0xFF64748B), "संग्रहीत")
        ArticleStatus.RETRACTED -> Triple(Color(0xFFFEE2E2), Color(0xFF991B1B), "वापस लिया गया")
    }

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(4.dp))
            .background(bgColor)
            .padding(horizontal = 8.dp, vertical = 3.dp)
    ) {
        Text(
            text = label,
            color = textColor,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

