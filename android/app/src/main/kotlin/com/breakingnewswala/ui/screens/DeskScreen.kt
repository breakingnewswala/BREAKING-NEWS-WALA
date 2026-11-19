package com.breakingnewswala.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
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
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.EditNote
import androidx.compose.material.icons.filled.FactCheck
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.breakingnewswala.ai.AiFactCheckReport
import com.breakingnewswala.ai.AiReporterDraft
import com.breakingnewswala.data.model.ArticleStatus
import com.breakingnewswala.data.model.NewsArticle
import com.breakingnewswala.data.model.NewsTaxonomy
import com.breakingnewswala.data.model.UserProfile
import com.breakingnewswala.data.model.UserRole
import com.breakingnewswala.ui.theme.BrandBlue
import com.breakingnewswala.ui.theme.BrandEmerald
import com.breakingnewswala.ui.theme.BrandRed
import com.breakingnewswala.viewmodel.UiState

@Composable
fun DeskScreen(
    userProfile: UserProfile?,
    isMasterAdmin: Boolean,
    myArticlesState: UiState<List<NewsArticle>>,
    pendingArticlesState: UiState<List<NewsArticle>>,
    allUsersState: UiState<List<UserProfile>>,
    aiDraftState: UiState<AiReporterDraft>?,
    factCheckState: Map<String, UiState<AiFactCheckReport>>,
    isSubmitting: Boolean,
    onGenerateDraft: (String, String) -> Unit,
    onApplyDraft: () -> Unit,
    onSubmitArticle: (
        title: String,
        summary: String,
        content: String,
        category: String,
        district: String,
        publishImmediately: Boolean,
        breaking: Boolean,
        live: Boolean,
        onDone: () -> Unit
    ) -> Unit,
    onRunFactCheck: (NewsArticle) -> Unit,
    onModerateArticle: (NewsArticle, ArticleStatus, Boolean, Boolean, String?, Int?) -> Unit,
    onAssignRole: (String, UserRole) -> Unit,
    modifier: Modifier = Modifier
) {
    val effectiveRole = when {
        isMasterAdmin -> UserRole.ADMIN
        userProfile != null -> userProfile.userRole
        else -> UserRole.READER
    }

    if (effectiveRole == UserRole.READER) {
        ReaderDeskNotice(userProfile = userProfile, modifier = modifier)
        return
    }

    var selectedDeskTab by rememberSaveable { mutableIntStateOf(0) }
    val tabs = if (effectiveRole == UserRole.ADMIN) {
        listOf("खबर भेजें", "सत्यापन कतार", "रोल प्रबंधन")
    } else {
        listOf("खबर भेजें", "मेरी खबरें")
    }

    Column(
        modifier = modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        TabRow(
            selectedTabIndex = selectedDeskTab.coerceIn(0, tabs.lastIndex),
            modifier = Modifier
                .widthIn(max = 680.dp)
                .fillMaxWidth()
        ) {
            tabs.forEachIndexed { index, title ->
                Tab(
                    selected = selectedDeskTab == index,
                    onClick = { selectedDeskTab = index },
                    text = {
                        Text(
                            text = title,
                            style = MaterialTheme.typography.labelLarge
                        )
                    },
                    modifier = Modifier.testTag("desk_tab_$index")
                )
            }
        }

        when {
            selectedDeskTab == 0 -> {
                ReporterComposePane(
                    userProfile = userProfile,
                    isAdmin = effectiveRole == UserRole.ADMIN,
                    aiDraftState = aiDraftState,
                    isSubmitting = isSubmitting,
                    onGenerateDraft = onGenerateDraft,
                    onClearDraft = onApplyDraft,
                    onSubmitArticle = onSubmitArticle
                )
            }

            effectiveRole == UserRole.ADMIN && selectedDeskTab == 1 -> {
                AdminModerationQueuePane(
                    pendingArticlesState = pendingArticlesState,
                    factCheckState = factCheckState,
                    onRunFactCheck = onRunFactCheck,
                    onModerateArticle = onModerateArticle
                )
            }

            effectiveRole == UserRole.ADMIN && selectedDeskTab == 2 -> {
                MasterAdminRoleManagerPane(
                    allUsersState = allUsersState,
                    onAssignRole = onAssignRole
                )
            }

            else -> {
                ReporterSubmissionsPane(myArticlesState = myArticlesState)
            }
        }
    }
}

@Composable
private fun ReaderDeskNotice(
    userProfile: UserProfile?,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .padding(20.dp),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .widthIn(max = 560.dp)
                .fillMaxWidth()
                .testTag("reader_desk_locked_card"),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Surface(
                    color = BrandRed.copy(alpha = 0.1f),
                    shape = RoundedCornerShape(50)
                ) {
                    Icon(
                        imageVector = Icons.Default.Lock,
                        contentDescription = null,
                        tint = BrandRed,
                        modifier = Modifier
                            .padding(14.dp)
                            .size(32.dp)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = "संवाददाता एवं न्यूज़ रूम डेस्क",
                    style = MaterialTheme.typography.headlineSmall
                )

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = "वर्तमान में आपका खाता 'पाठक (User)' मोड में है।\n\nGoogle लॉगिन के बाद हर नया उपयोगकर्ता डिफ़ॉल्ट रूप से पाठक बनता है। जब मास्टर एडमिन (breakingnewswala.com@gmail.com) आपके खाते को 'संवाददाता (REPORTER)' भूमिका देते हैं, तब यह रिपोर्टिंग डेस्क अपने आप अनलॉक हो जाता है।",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                if (userProfile != null) {
                    Spacer(modifier = Modifier.height(16.dp))
                    Surface(
                        color = MaterialTheme.colorScheme.surfaceVariant,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text(
                                text = "पंजीकृत ईमेल: ${userProfile.email}",
                                style = MaterialTheme.typography.labelLarge
                            )
                            Text(
                                text = "वर्तमान भूमिका: ${userProfile.userRole.labelHi}",
                                style = MaterialTheme.typography.bodyMedium,
                                color = BrandBlue
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ReporterComposePane(
    userProfile: UserProfile?,
    isAdmin: Boolean,
    aiDraftState: UiState<AiReporterDraft>?,
    isSubmitting: Boolean,
    onGenerateDraft: (String, String) -> Unit,
    onClearDraft: () -> Unit,
    onSubmitArticle: (
        title: String,
        summary: String,
        content: String,
        category: String,
        district: String,
        publishImmediately: Boolean,
        breaking: Boolean,
        live: Boolean,
        onDone: () -> Unit
    ) -> Unit
) {
    var roughNotes by rememberSaveable { mutableStateOf("") }
    var title by rememberSaveable { mutableStateOf("") }
    var summary by rememberSaveable { mutableStateOf("") }
    var content by rememberSaveable { mutableStateOf("") }
    var selectedCategory by rememberSaveable { mutableStateOf("राष्ट्रीय") }
    var selectedDistrict by rememberSaveable {
        mutableStateOf(userProfile?.district?.ifBlank { "नई दिल्ली" } ?: "नई दिल्ली")
    }
    var publishImmediately by rememberSaveable { mutableStateOf(isAdmin) }
    var breaking by rememberSaveable { mutableStateOf(false) }
    var live by rememberSaveable { mutableStateOf(false) }

    val availableCategories = remember { NewsTaxonomy.categories.filter { it != "सभी" && it != "ब्रेकिंग" } }
    val availableDistricts = remember { NewsTaxonomy.districts.filter { it != "सभी जिले" } }

    LazyColumn(
        modifier = Modifier
            .widthIn(max = 680.dp)
            .fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = BrandBlue.copy(alpha = 0.06f)),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.AutoAwesome,
                            contentDescription = null,
                            tint = BrandBlue
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Gemini AI रिपोर्टर असिस्टेंट",
                            style = MaterialTheme.typography.titleMedium,
                            color = BrandBlue
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = roughNotes,
                        onValueChange = { roughNotes = it },
                        label = { Text("घटना के कच्चे नोट्स या तथ्य लिखें") },
                        minLines = 2,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("ai_rough_notes_input")
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Button(
                        onClick = { onGenerateDraft(roughNotes, selectedDistrict) },
                        colors = ButtonDefaults.buttonColors(containerColor = BrandBlue),
                        modifier = Modifier.testTag("ai_generate_draft_button")
                    ) {
                        Text("AI से समाचार ड्राफ्ट बनाएं")
                    }

                    when (aiDraftState) {
                        is UiState.Loading -> {
                            Spacer(modifier = Modifier.height(8.dp))
                            CircularProgressIndicator(
                                color = BrandBlue,
                                modifier = Modifier.size(22.dp)
                            )
                        }

                        is UiState.Success -> {
                            val draft = aiDraftState.data
                            Spacer(modifier = Modifier.height(10.dp))
                            Text(
                                text = "सुझावित हेडलाइन: ${draft.polishedHeadline}",
                                style = MaterialTheme.typography.labelLarge
                            )
                            Text(
                                text = "टिप: ${draft.editorialTip}",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            OutlinedButton(
                                onClick = {
                                    title = draft.polishedHeadline
                                    summary = draft.leadSummary
                                    content = draft.bodyText
                                    if (availableCategories.contains(draft.suggestedCategory)) {
                                        selectedCategory = draft.suggestedCategory
                                    }
                                    onClearDraft()
                                },
                                modifier = Modifier.testTag("ai_apply_draft_button")
                            ) {
                                Text("फॉर्म में लागू करें")
                            }
                        }

                        is UiState.Error -> {
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = aiDraftState.message,
                                color = MaterialTheme.colorScheme.error,
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }

                        null -> Unit
                    }
                }
            }
        }

        item {
            OutlinedTextField(
                value = title,
                onValueChange = { title = it },
                label = { Text("समाचार हेडलाइन (न्यूनतम 5 अक्षर)") },
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("compose_title_input")
            )
        }

        item {
            OutlinedTextField(
                value = summary,
                onValueChange = { summary = it },
                label = { Text("संक्षिप्त सारांश") },
                minLines = 2,
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("compose_summary_input")
            )
        }

        item {
            OutlinedTextField(
                value = content,
                onValueChange = { content = it },
                label = { Text("पूरा समाचार विवरण (न्यूनतम 10 अक्षर)") },
                minLines = 5,
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("compose_content_input")
            )
        }

        item {
            Text(text = "श्रेणी चुनें", style = MaterialTheme.typography.labelLarge)
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(availableCategories) { cat ->
                    FilterChip(
                        selected = cat == selectedCategory,
                        onClick = { selectedCategory = cat },
                        label = { Text(cat) }
                    )
                }
            }
        }

        item {
            Text(text = "जिला / केंद्र चुनें", style = MaterialTheme.typography.labelLarge)
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(availableDistricts) { dist ->
                    FilterChip(
                        selected = dist == selectedDistrict,
                        onClick = { selectedDistrict = dist },
                        label = { Text(dist) }
                    )
                }
            }
        }

        if (isAdmin) {
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("सीधे लाइव प्रकाशित करें (एडमिन)", style = MaterialTheme.typography.bodyMedium)
                            Switch(checked = publishImmediately, onCheckedChange = { publishImmediately = it })
                        }
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("ब्रेकिंग न्यूज़ टैग लगाएं", style = MaterialTheme.typography.bodyMedium)
                            Switch(checked = breaking, onCheckedChange = { breaking = it })
                        }
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("LIVE अपडेट चिह्न दिखाएं", style = MaterialTheme.typography.bodyMedium)
                            Switch(checked = live, onCheckedChange = { live = it })
                        }
                    }
                }
            }
        }

        item {
            Button(
                onClick = {
                    onSubmitArticle(
                        title,
                        summary,
                        content,
                        selectedCategory,
                        selectedDistrict,
                        publishImmediately,
                        breaking,
                        live
                    ) {
                        title = ""
                        summary = ""
                        content = ""
                        roughNotes = ""
                    }
                },
                enabled = !isSubmitting,
                colors = ButtonDefaults.buttonColors(containerColor = BrandRed),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp)
                    .testTag("submit_article_button")
            ) {
                if (isSubmitting) {
                    CircularProgressIndicator(
                        color = Color.White,
                        modifier = Modifier.size(20.dp),
                        strokeWidth = 2.dp
                    )
                } else {
                    Icon(Icons.Default.Send, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (isAdmin && publishImmediately) "समाचार प्रकाशित करें" else "सत्यापन के लिए भेजें",
                        style = MaterialTheme.typography.titleMedium
                    )
                }
            }
        }
    }
}

@Composable
private fun ReporterSubmissionsPane(
    myArticlesState: UiState<List<NewsArticle>>
) {
    when (myArticlesState) {
        is UiState.Loading -> {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = BrandRed)
            }
        }

        is UiState.Error -> {
            Box(modifier = Modifier.fillMaxSize().padding(20.dp), contentAlignment = Alignment.Center) {
                Text(myArticlesState.message, color = MaterialTheme.colorScheme.error)
            }
        }

        is UiState.Success -> {
            val articles = myArticlesState.data
            if (articles.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.Center) {
                    Text(
                        text = "आपने अभी तक कोई रिपोर्ट नहीं भेजी है।",
                        style = MaterialTheme.typography.titleMedium
                    )
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .widthIn(max = 680.dp)
                        .fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(articles, key = { it.id }) { article ->
                        Card(
                            shape = RoundedCornerShape(14.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(
                                        text = "${article.district} • ${article.category}",
                                        style = MaterialTheme.typography.labelMedium,
                                        color = BrandBlue
                                    )
                                    Text(
                                        text = article.articleStatus.labelHi,
                                        style = MaterialTheme.typography.labelMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = when (article.articleStatus) {
                                            ArticleStatus.PUBLISHED -> BrandEmerald
                                            ArticleStatus.REJECTED -> BrandRed
                                            else -> MaterialTheme.colorScheme.onSurfaceVariant
                                        }
                                    )
                                }
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(article.title, style = MaterialTheme.typography.titleMedium)
                                if (!article.editorialNote.isNullOrBlank()) {
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = "डेस्क टिप्पणी: ${article.editorialNote}",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
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
private fun AdminModerationQueuePane(
    pendingArticlesState: UiState<List<NewsArticle>>,
    factCheckState: Map<String, UiState<AiFactCheckReport>>,
    onRunFactCheck: (NewsArticle) -> Unit,
    onModerateArticle: (NewsArticle, ArticleStatus, Boolean, Boolean, String?, Int?) -> Unit
) {
    when (pendingArticlesState) {
        is UiState.Loading -> {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = BrandRed)
            }
        }

        is UiState.Error -> {
            Box(modifier = Modifier.fillMaxSize().padding(20.dp), contentAlignment = Alignment.Center) {
                Text(pendingArticlesState.message, color = MaterialTheme.colorScheme.error)
            }
        }

        is UiState.Success -> {
            val pending = pendingArticlesState.data
            if (pending.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.Center) {
                    Text(
                        text = "सत्यापन के लिए अभी कोई रिपोर्ट लंबित नहीं है।",
                        style = MaterialTheme.typography.titleMedium
                    )
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .widthIn(max = 680.dp)
                        .fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(pending, key = { it.id }) { article ->
                        val fcState = factCheckState[article.id]
                        var markBreaking by remember(article.id) { mutableStateOf(false) }

                        Card(
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text(
                                    text = "${article.authorName} • ${article.district} • ${article.category}",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = BrandBlue
                                )
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(article.title, style = MaterialTheme.typography.titleMedium)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = article.content,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    maxLines = 4
                                )

                                Spacer(modifier = Modifier.height(10.dp))

                                OutlinedButton(
                                    onClick = { onRunFactCheck(article) },
                                    modifier = Modifier.testTag("ai_fact_check_${article.id}")
                                ) {
                                    Icon(Icons.Default.FactCheck, contentDescription = null)
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Gemini 10-पॉइंट फैक्ट-चेक")
                                }

                                when (fcState) {
                                    is UiState.Loading -> {
                                        Spacer(modifier = Modifier.height(8.dp))
                                        CircularProgressIndicator(modifier = Modifier.size(20.dp))
                                    }

                                    is UiState.Success -> {
                                        val report = fcState.data
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Surface(
                                            color = BrandEmerald.copy(alpha = 0.08f),
                                            shape = RoundedCornerShape(10.dp),
                                            modifier = Modifier.fillMaxWidth()
                                        ) {
                                            Column(modifier = Modifier.padding(10.dp)) {
                                                Text(
                                                    text = "स्कोर: ${report.scoreOutOf100}/100 • ${report.verdict}",
                                                    style = MaterialTheme.typography.labelLarge,
                                                    color = BrandEmerald
                                                )
                                                Text(
                                                    text = report.editorNoteHi,
                                                    style = MaterialTheme.typography.bodyMedium
                                                )
                                            }
                                        }
                                    }

                                    is UiState.Error -> {
                                        Spacer(modifier = Modifier.height(6.dp))
                                        Text(fcState.message, color = MaterialTheme.colorScheme.error)
                                    }

                                    null -> Unit
                                }

                                Spacer(modifier = Modifier.height(8.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text("ब्रेकिंग में दिखाएं", style = MaterialTheme.typography.bodyMedium)
                                    Switch(checked = markBreaking, onCheckedChange = { markBreaking = it })
                                }

                                Spacer(modifier = Modifier.height(10.dp))

                                val score = (fcState as? UiState.Success)?.data?.scoreOutOf100
                                val note = (fcState as? UiState.Success)?.data?.editorNoteHi
                                    ?: "एडमिन द्वारा सत्यापित"

                                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                    Button(
                                        onClick = {
                                            onModerateArticle(
                                                article,
                                                ArticleStatus.PUBLISHED,
                                                markBreaking,
                                                markBreaking,
                                                note,
                                                score
                                            )
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = BrandEmerald),
                                        modifier = Modifier
                                            .weight(1f)
                                            .testTag("approve_article_${article.id}")
                                    ) {
                                        Icon(Icons.Default.CheckCircle, contentDescription = null, modifier = Modifier.size(18.dp))
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("प्रकाशित करें")
                                    }

                                    OutlinedButton(
                                        onClick = {
                                            onModerateArticle(
                                                article,
                                                ArticleStatus.REJECTED,
                                                false,
                                                false,
                                                "संपादकीय मानकों पर खरा नहीं।",
                                                score
                                            )
                                        },
                                        modifier = Modifier
                                            .weight(1f)
                                            .testTag("reject_article_${article.id}")
                                    ) {
                                        Icon(Icons.Default.Close, contentDescription = null, modifier = Modifier.size(18.dp))
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("अस्वीकृत करें")
                                    }
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
private fun MasterAdminRoleManagerPane(
    allUsersState: UiState<List<UserProfile>>,
    onAssignRole: (String, UserRole) -> Unit
) {
    when (allUsersState) {
        is UiState.Loading -> {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = BrandRed)
            }
        }

        is UiState.Error -> {
            Box(modifier = Modifier.fillMaxSize().padding(20.dp), contentAlignment = Alignment.Center) {
                Text(allUsersState.message, color = MaterialTheme.colorScheme.error)
            }
        }

        is UiState.Success -> {
            val users = allUsersState.data
            LazyColumn(
                modifier = Modifier
                    .widthIn(max = 680.dp)
                    .fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                item {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.AdminPanelSettings,
                            contentDescription = null,
                            tint = BrandRed
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "मास्टर एडमिन — संवाददाता व भूमिका प्रबंधन",
                            style = MaterialTheme.typography.titleMedium
                        )
                    }
                }

                items(users, key = { it.uid }) { user ->
                    Card(
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text(
                                text = user.displayName,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "${user.email} • जिला: ${user.district}",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                UserRole.entries.forEach { role ->
                                    FilterChip(
                                        selected = user.userRole == role,
                                        onClick = { onAssignRole(user.uid, role) },
                                        label = { Text(role.labelHi) },
                                        leadingIcon = if (role == UserRole.REPORTER) {
                                            { Icon(Icons.Default.EditNote, contentDescription = null, modifier = Modifier.size(16.dp)) }
                                        } else null,
                                        modifier = Modifier.testTag("assign_role_${user.uid}_${role.name}")
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
