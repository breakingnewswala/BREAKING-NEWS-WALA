package com.breakingnewswala.core.designsystem.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.breakingnewswala.core.designsystem.theme.*

@Composable
fun NewsCard(
    title: String,
    modifier: Modifier = Modifier,
    summary: String? = null,
    imageUrl: String? = null,
    categoryName: String? = null,
    districtName: String? = null,
    publishedAt: String? = null,
    isBreaking: Boolean = false,
    onClick: () -> Unit,
    onShareClick: (() -> Unit)? = null
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            // Optional Featured Image
            if (!imageUrl.isNullOrBlank()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(180.dp)
                ) {
                    AsyncImage(
                        model = imageUrl,
                        contentDescription = title,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )

                    // Breaking Badge Overlay
                    if (isBreaking) {
                        Box(
                            modifier = Modifier
                                .padding(8.dp)
                                .background(BnwRed, shape = RoundedCornerShape(4.dp))
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                                .align(Alignment.TopStart)
                        ) {
                            Text(
                                text = "ब्रेकिंग न्यूज़",
                                color = Color.White,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }

            // Article Details
            Column(modifier = Modifier.padding(12.dp)) {
                // Category & District Badges
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    if (!categoryName.isNullOrBlank()) {
                        Text(
                            text = categoryName.uppercase(),
                            color = BnwBlue,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    if (!categoryName.isNullOrBlank() && !districtName.isNullOrBlank()) {
                        Text(
                            text = " • ",
                            color = Color(0xFF94A3B8),
                            fontSize = 11.sp
                        )
                    }

                    if (!districtName.isNullOrBlank()) {
                        Text(
                            text = districtName,
                            color = Color(0xFF475569),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }

                    Spacer(modifier = Modifier.weight(1f))

                    if (!publishedAt.isNullOrBlank()) {
                        Text(
                            text = publishedAt,
                            color = Color(0xFF94A3B8),
                            fontSize = 11.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.height(6.dp))

                // Headline
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    color = BnwTextPrimary,
                    maxLines = 3,
                    overflow = TextOverflow.Ellipsis
                )

                // Optional Summary
                if (!summary.isNullOrBlank()) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = summary,
                        style = MaterialTheme.typography.bodyMedium,
                        color = BnwTextSecondary,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                // Card Footer
                if (onShareClick != null) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End
                    ) {
                        IconButton(
                            onClick = onShareClick,
                            modifier = Modifier.size(32.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Share,
                                contentDescription = "साझा करें",
                                tint = Color(0xFF64748B),
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

