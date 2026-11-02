package com.breakingnewswala.core.designsystem.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.breakingnewswala.core.designsystem.theme.BnwBlue
import com.breakingnewswala.core.designsystem.theme.BnwRed
import com.breakingnewswala.core.designsystem.theme.BnwYellow

@Composable
fun BnwMasthead(
    modifier: Modifier = Modifier,
    onSearchClick: (() -> Unit)? = null,
    onNotificationsClick: (() -> Unit)? = null,
    subtitle: String? = null
) {
    Surface(
        modifier = modifier.fillMaxWidth(),
        color = Color.White,
        shadowElevation = 2.dp
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Official Brand Masthead Block
                Row(verticalAlignment = Alignment.CenterVertically) {
                    // Yellow Accent Box
                    Box(
                        modifier = Modifier
                            .background(BnwYellow, shape = RoundedCornerShape(4.dp))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = "LIVE",
                            color = Color.Black,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Black
                        )
                    }

                    Spacer(modifier = Modifier.width(8.dp))

                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "BREAKING ",
                                color = BnwRed,
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Black,
                                letterSpacing = (-0.3).sp
                            )
                            Text(
                                text = "NEWS ",
                                color = Color.Black,
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Black,
                                letterSpacing = (-0.3).sp
                            )
                            Text(
                                text = "WALA",
                                color = BnwBlue,
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Black,
                                letterSpacing = (-0.3).sp
                            )
                        }
                        Text(
                            text = subtitle ?: "ब्रेकिंग न्यूज़ वाला • मध्य प्रदेश",
                            color = Color(0xFF64748B),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }

                // Action Icons
                Row(verticalAlignment = Alignment.CenterVertically) {
                    if (onSearchClick != null) {
                        IconButton(onClick = onSearchClick) {
                            Icon(
                                imageVector = Icons.Default.Search,
                                contentDescription = "खोजें",
                                tint = Color(0xFF1E293B)
                            )
                        }
                    }
                    if (onNotificationsClick != null) {
                        IconButton(onClick = onNotificationsClick) {
                            Icon(
                                imageVector = Icons.Default.Notifications,
                                contentDescription = "सूचनाएं",
                                tint = Color(0xFF1E293B)
                            )
                        }
                    }
                }
            }

            // Tri-color Bottom Accent Line
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(3.dp)
            ) {
                Box(modifier = Modifier.weight(1f).fillMaxHeight().background(BnwRed))
                Box(modifier = Modifier.weight(1f).fillMaxHeight().background(BnwYellow))
                Box(modifier = Modifier.weight(1f).fillMaxHeight().background(BnwBlue))
            }
        }
    }
}

