package com.breakingnewswala.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.breakingnewswala.core.designsystem.components.*
import com.breakingnewswala.core.designsystem.theme.*
import com.breakingnewswala.viewmodel.SearchViewModel

@Composable
fun SearchScreen(
    viewModel: SearchViewModel,
    onArticleClick: (String) -> Unit,
    onBackClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            BnwTopBar(
                title = "समाचार खोजें",
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
            // Search Input Box
            Box(modifier = Modifier.padding(16.dp)) {
                OutlinedTextField(
                    value = uiState.query,
                    onValueChange = { viewModel.onQueryChange(it) },
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text("खबर, नेता, ज़िला, मंडी या विषय खोजें...") },
                    leadingIcon = {
                        Icon(Icons.Default.Search, contentDescription = null, tint = BnwRed)
                    },
                    trailingIcon = {
                        if (uiState.query.isNotEmpty()) {
                            IconButton(onClick = { viewModel.onQueryChange("") }) {
                                Icon(Icons.Default.Clear, contentDescription = "हटाएं")
                            }
                        }
                    },
                    shape = RoundedCornerShape(8.dp),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = BnwRed,
                        unfocusedBorderColor = Color(0xFFCBD5E1),
                        focusedContainerColor = Color.White,
                        unfocusedContainerColor = Color.White
                    )
                )
            }

            // Trending Search Chips
            Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)) {
                Text(
                    text = "🔥 ट्रेंडिंग विषय:",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = BnwTextSecondary
                )
                Spacer(modifier = Modifier.height(6.dp))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    uiState.trendingSearches.forEach { term ->
                        FilterChip(
                            label = term,
                            isSelected = uiState.query == term,
                            onClick = { viewModel.onQueryChange(term) }
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Search Results
            if (uiState.isLoading) {
                LoadingIndicator(message = "खोज परिणाम प्राप्त हो रहे हैं...")
            } else if (uiState.results.isEmpty() && uiState.query.trim().length >= 2) {
                EmptyStateView(
                    title = "कोई परिणाम नहीं मिला",
                    subtitle = "\"${uiState.query}\" के लिए कोई समाचार उपलब्ध नहीं है। कृपया अन्य शब्द आज़माएं।"
                )
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp)
                ) {
                    items(uiState.results, key = { it.id }) { article ->
                        Box(modifier = Modifier.padding(vertical = 4.dp)) {
                            NewsCard(
                                title = article.title,
                                summary = article.summary,
                                imageUrl = article.featuredImage,
                                categoryName = article.categoryName,
                                districtName = article.districtName,
                                publishedAt = article.publishedAt,
                                onClick = { onArticleClick(article.id) }
                            )
                        }
                    }
                }
            }
        }
    }
}
