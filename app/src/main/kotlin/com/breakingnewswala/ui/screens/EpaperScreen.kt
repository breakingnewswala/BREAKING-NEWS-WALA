package com.breakingnewswala.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.ZoomIn
import androidx.compose.material.icons.filled.ZoomOut
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.breakingnewswala.data.model.EpaperEdition
import com.breakingnewswala.ui.theme.BrandBlue
import com.breakingnewswala.ui.theme.BrandRed
import com.breakingnewswala.ui.theme.BrandYellow
import com.breakingnewswala.ui.theme.RozhaDisplayFont

@Composable
fun EpaperScreen(
    editions: List<EpaperEdition>,
    modifier: Modifier = Modifier
) {
    var activeViewerEdition by remember { mutableStateOf<EpaperEdition?>(null) }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .testTag("epaper_list"),
        contentPadding = PaddingValues(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item(key = "epaper_banner") {
            Column(
                modifier = Modifier
                    .widthIn(max = 680.dp)
                    .fillMaxWidth()
            ) {
                Text(
                    text = "डिजिटल ई-पेपर संस्करण",
                    style = MaterialTheme.typography.headlineSmall,
                    color = MaterialTheme.colorScheme.onBackground
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "राष्ट्रीय और मध्य प्रदेश के 55 जिलों का 12-पृष्ठीय प्रामाणिक ब्रॉडशीट ई-पेपर",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        items(editions, key = { it.id }) { edition ->
            Card(
                modifier = Modifier
                    .widthIn(max = 680.dp)
                    .fillMaxWidth()
                    .testTag("epaper_card_${edition.id}")
                    .clickable { activeViewerEdition = edition },
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .background(BrandRed.copy(alpha = 0.12f), RoundedCornerShape(10.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.MenuBook,
                                    contentDescription = null,
                                    tint = BrandRed,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text(
                                    text = edition.cityOrEdition,
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "${edition.state} • ${edition.editionDate}",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }

                        Surface(
                            color = BrandBlue,
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text(
                                text = "${edition.pagesCount} पृष्ठ",
                                color = Color.White,
                                style = MaterialTheme.typography.labelMedium,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))
                    HorizontalDivider(color = BrandYellow, thickness = 2.dp)
                    Spacer(modifier = Modifier.height(12.dp))

                    Text(
                        text = edition.leadHeadline,
                        fontFamily = RozhaDisplayFont,
                        style = MaterialTheme.typography.titleLarge,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = edition.leadSummary,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    Spacer(modifier = Modifier.height(10.dp))
                    Surface(
                        color = MaterialTheme.colorScheme.surfaceVariant,
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(10.dp)) {
                            Text(
                                text = "अन्य प्रमुख सुर्खियां:",
                                style = MaterialTheme.typography.labelMedium,
                                color = BrandRed
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "• ${edition.secondHeadline}",
                                style = MaterialTheme.typography.bodyMedium
                            )
                            Text(
                                text = "• ${edition.thirdHeadline}",
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Button(
                            onClick = { activeViewerEdition = edition },
                            colors = ButtonDefaults.buttonColors(containerColor = BrandRed),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("ई-पेपर पढ़ें (12 पृष्ठ)", color = Color.White)
                        }

                        OutlinedButton(
                            onClick = { activeViewerEdition = edition },
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Download,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("PDF डाउनलोड")
                        }
                    }
                }
            }
        }
    }

    activeViewerEdition?.let { edition ->
        EpaperBroadsheetViewerDialog(
            edition = edition,
            onDismiss = { activeViewerEdition = null }
        )
    }
}

@Composable
fun EpaperBroadsheetViewerDialog(
    edition: EpaperEdition,
    onDismiss: () -> Unit
) {
    val totalPages = if (edition.pagesCount > 0) edition.pagesCount else 12
    var selectedPage by remember { mutableIntStateOf(1) }
    var zoomScale by remember { mutableFloatStateOf(1.0f) }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = MaterialTheme.colorScheme.background
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(12.dp)
            ) {
                // Top Action Bar
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = edition.cityOrEdition,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "${edition.editionDate} • ब्रॉडशीट 32.9 × 52 सेमी",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        IconButton(
                            onClick = { if (zoomScale > 0.8f) zoomScale -= 0.2f }
                        ) {
                            Icon(Icons.Default.ZoomOut, contentDescription = "ज़ूम आउट")
                        }
                        Text(
                            text = "${(zoomScale * 100).toInt()}%",
                            style = MaterialTheme.typography.labelMedium
                        )
                        IconButton(
                            onClick = { if (zoomScale < 2.5f) zoomScale += 0.2f }
                        ) {
                            Icon(Icons.Default.ZoomIn, contentDescription = "ज़ूम इन")
                        }
                        IconButton(onClick = onDismiss) {
                            Icon(Icons.Default.Close, contentDescription = "बंद करें")
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Page Navigation Pills (1..totalPages)
                LazyRow(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    contentPadding = PaddingValues(horizontal = 4.dp)
                ) {
                    items(totalPages) { idx ->
                        val pageNum = idx + 1
                        val isSelected = pageNum == selectedPage
                        Surface(
                            modifier = Modifier.clickable { selectedPage = pageNum },
                            color = if (isSelected) BrandRed else MaterialTheme.colorScheme.surfaceVariant,
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text(
                                text = "पृष्ठ $pageNum",
                                color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Broadsheet View Area (Aspect ratio: 32.9 / 52 = 0.632)
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth(),
                    contentAlignment = Alignment.Center
                ) {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth(0.92f)
                            .aspectRatio(0.632f)
                            .graphicsLayer(scaleX = zoomScale, scaleY = zoomScale),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        shape = RoundedCornerShape(4.dp),
                        elevation = CardDefaults.cardElevation(defaultElevation = 6.dp)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(16.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            // Newspaper Masthead
                            Text(
                                text = "ब्रेकिंग न्यूज़ वाला",
                                fontFamily = RozhaDisplayFont,
                                style = MaterialTheme.typography.headlineMedium,
                                color = BrandRed
                            )
                            Text(
                                text = "मध्य प्रदेश का प्रमुख डिजिटल एवं ब्रॉडशीट दैनिक • पृष्ठ $selectedPage / $totalPages",
                                style = MaterialTheme.typography.labelSmall,
                                color = Color.DarkGray
                            )
                            HorizontalDivider(
                                color = BrandYellow,
                                thickness = 2.dp,
                                modifier = Modifier.padding(vertical = 8.dp)
                            )

                            // Page Content Summary
                            Text(
                                text = if (selectedPage == 1) edition.leadHeadline else "पृष्ठ $selectedPage: जिला एवं संभागीय विशेष समाचार",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = Color.Black,
                                textAlign = TextAlign.Center
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = if (selectedPage == 1) edition.leadSummary else "इस पृष्ठ पर मध्य प्रदेश के संबंधित जिले के प्रशासनिक, विकास व अपराध संबंधी सत्यापित समाचार प्रस्तुत हैं। 10-पॉइंट फैक्ट-चेकिंग द्वारा अधिकृत।",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color.Gray,
                                textAlign = TextAlign.Justify
                            )

                            Spacer(modifier = Modifier.weight(1f))

                            // Print Quality Banner
                            Surface(
                                color = Color(0xFFF3F4F6),
                                shape = RoundedCornerShape(4.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier.padding(6.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "मुद्रण मानक: 300 DPI ब्रॉडशीट",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = Color.DarkGray
                                    )
                                    Text(
                                        text = "3886 × 6142 px",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = Color.DarkGray
                                    )
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Bottom Export Bar
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = { /* In Android runtime, launches PDF download or Intent */ },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = BrandRed),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Icon(Icons.Default.Download, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("संपूर्ण 12 पृष्ठ PDF")
                    }

                    OutlinedButton(
                        onClick = { /* Export current page PNG */ },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("पृष्ठ $selectedPage डाउनलोड")
                    }
                }
            }
        }
    }
}
