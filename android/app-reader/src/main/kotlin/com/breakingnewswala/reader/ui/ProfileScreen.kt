package com.breakingnewswala.reader.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.breakingnewswala.core.designsystem.components.BnwTopBar
import com.breakingnewswala.core.designsystem.theme.*

@Composable
fun ProfileScreen(
    onBackClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    var breakingAlertsEnabled by remember { mutableStateOf(true) }
    var districtAlertsEnabled by remember { mutableStateOf(true) }

    Scaffold(
        topBar = {
            BnwTopBar(
                title = "सेटिंग्स व प्राथमिकताएं",
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
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            // App Identity Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(8.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "BREAKING NEWS WALA",
                        fontWeight = FontWeight.Black,
                        color = BnwRed,
                        fontSize = 18.sp
                    )
                    Text(
                        text = "मध्य प्रदेश का अग्रणी डिजिटल न्यूज़ नेटवर्क",
                        color = BnwTextSecondary,
                        fontSize = 13.sp
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "संस्करण: 1.0.0 (Native Android)",
                        color = BnwTextTertiary,
                        fontSize = 11.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Notifications Section
            Text(
                text = "अधिसूचना सेटिंग्स",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = BnwTextPrimary
            )
            Spacer(modifier = Modifier.height(8.dp))

            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(8.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("ब्रेकिंग न्यूज़ अलर्ट", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                            Text("अति महत्वपूर्ण घटनाओं की त्वरित सूचना", fontSize = 12.sp, color = BnwTextTertiary)
                        }
                        Switch(
                            checked = breakingAlertsEnabled,
                            onCheckedChange = { breakingAlertsEnabled = it },
                            colors = SwitchDefaults.colors(checkedThumbColor = BnwRed, checkedTrackColor = BnwLightRed)
                        )
                    }

                    HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp), color = BnwBorder)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("ज़िला समाचार अलर्ट", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                            Text("आपके गृह ज़िले की प्रमुख खबरें", fontSize = 12.sp, color = BnwTextTertiary)
                        }
                        Switch(
                            checked = districtAlertsEnabled,
                            onCheckedChange = { districtAlertsEnabled = it },
                            colors = SwitchDefaults.colors(checkedThumbColor = BnwRed, checkedTrackColor = BnwLightRed)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Legal & Statutory Compliance Info
            Text(
                text = "कानूनी एवं विनियामक जानकारी",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = BnwTextPrimary
            )
            Spacer(modifier = Modifier.height(8.dp))

            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(8.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "• भारतीय डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम (DPDPA 2023) अनुपालित",
                        fontSize = 12.sp,
                        color = BnwTextSecondary
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "• भारतीय विज्ञापन मानक परिषद (ASCI) संहिता अनुपालित",
                        fontSize = 12.sp,
                        color = BnwTextSecondary
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "• राज्य प्रतीक अधिनियम 2005 का पूर्ण अनुपालन",
                        fontSize = 12.sp,
                        color = BnwTextSecondary
                    )
                }
            }
        }
    }
}

