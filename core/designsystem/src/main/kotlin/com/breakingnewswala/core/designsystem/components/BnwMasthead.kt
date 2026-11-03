package com.breakingnewswala.core.designsystem.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.breakingnewswala.core.designsystem.R
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
    // Animated pulsing effect for the LIVE indicator
    val infiniteTransition = rememberInfiniteTransition(label = "LivePulse")
    val livePulseAlpha by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 0.25f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 700, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "LiveAlphaPulse"
    )

    Surface(
        modifier = modifier.fillMaxWidth(),
        color = Color.White,
        shadowElevation = 2.dp
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Official Brand Logo + Animated Blinking LIVE Badge
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.weight(1f, fill = false)
                ) {
                    Image(
                        painter = painterResource(id = R.drawable.ic_bnw_brand_logo),
                        contentDescription = "ब्रेकिंग न्यूज़ वाला",
                        modifier = Modifier
                            .height(42.dp)
                            .wrapContentWidth(),
                        contentScale = ContentScale.Fit
                    )

                    Spacer(modifier = Modifier.width(10.dp))

                    // Blinking LIVE Badge
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = Color(0xFFFEF2F2),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFECACA)),
                        modifier = Modifier.clip(RoundedCornerShape(12.dp))
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .alpha(livePulseAlpha)
                                    .background(Color(0xFFDC2626), shape = CircleShape)
                            )
                            Spacer(modifier = Modifier.width(5.dp))
                            Text(
                                text = "LIVE",
                                color = Color(0xFFDC2626),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Black,
                                letterSpacing = 0.6.sp
                            )
                        }
                    }
                }

                // Header Action Icons
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

            // Tri-color Bottom Accent Line (Red, Yellow, Blue)
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


