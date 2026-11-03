package com.breakingnewswala.core.designsystem.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage

@Composable
fun AscAdBanner(
    creativeUrl: String,
    modifier: Modifier = Modifier,
    isSponsored: Boolean = false,
    advertiserName: String? = null,
    onClick: (() -> Unit)? = null
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(6.dp))
            .background(Color(0xFFF1F5F9))
            .border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(6.dp))
            .clickable(enabled = onClick != null) { onClick?.invoke() }
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            // Mandatory ASCI Header Badge (RULE-AD-001)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFFE2E8F0))
                    .padding(horizontal = 8.dp, vertical = 3.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = if (isSponsored) "प्रायोजित (SPONSORED)" else "विज्ञापन (ADVERTISEMENT)",
                    color = Color(0xFF475569),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 0.5.sp
                )

                if (!advertiserName.isNullOrBlank()) {
                    Text(
                        text = advertiserName,
                        color = Color(0xFF64748B),
                        fontSize = 10.sp
                    )
                }
            }

            // Creative Image
            AsyncImage(
                model = creativeUrl,
                contentDescription = "विज्ञापन",
                modifier = Modifier
                    .fillMaxWidth()
                    .height(90.dp),
                contentScale = ContentScale.Crop
            )
        }
    }
}

