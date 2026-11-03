package com.breakingnewswala.ui

import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.credentials.CredentialManager
import com.breakingnewswala.auth.GoogleAuthManager
import com.breakingnewswala.core.designsystem.components.BnwTopBar
import com.breakingnewswala.core.designsystem.theme.*
import com.breakingnewswala.firebase.BnwFirestoreRepository
import com.breakingnewswala.firebase.UserFirestoreModel
import com.google.firebase.Firebase
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.auth
import kotlinx.coroutines.launch


enum class AppRole(val titleHi: String, val descHi: String) {
    READER(
        titleHi = "🟢 पाठक (Reader / User Mode)",
        descHi = "समाचार पढ़ना, वीडियो देखना, ज़िला फ़िल्टर, ई-पेपर और सिक्के कमाना।"
    ),
    REPORTER(
        titleHi = "🔵 संवाददाता (Reporter Desk)",
        descHi = "ग्रामीण व ज़िला फील्ड से स्टोरी सबमिशन, वीडियो अपलोड व स्थिति ट्रैकिंग।"
    ),
    ADMIN(
        titleHi = "🔴 मुख्य संपादक (Newsroom Admin)",
        descHi = "10-बिंदु तथ्य जांच, स्टोरी अप्रूवल, संशोधन अनुरोध व लाइव पब्लिशिंग।"
    )
}

@Composable
fun ProfileScreen(
    userCoins: Int,
    bookmarkedCount: Int,
    currentRole: AppRole = AppRole.READER,
    onRoleChange: (AppRole) -> Unit = {},
    onBackClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    var breakingAlertsEnabled by remember { mutableStateOf(true) }
    var districtAlertsEnabled by remember { mutableStateOf(true) }
    var selectedHomeDistrict by remember { mutableStateOf("भोपाल (Bhopal)") }

    Scaffold(
        topBar = {
            BnwTopBar(
                title = "प्रोफ़ाइल व सेटिंग्स",
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
            // App & Reader Identity Card
            val context = LocalContext.current
            val coroutineScope = rememberCoroutineScope()
            val credentialManager = remember { CredentialManager.create(context) }
            val firestoreRepo = remember { BnwFirestoreRepository(context) }
            var currentUser by remember { mutableStateOf(Firebase.auth.currentUser) }
            var isAuthLoading by remember { mutableStateOf(false) }

            DisposableEffect(Unit) {
                val listener = FirebaseAuth.AuthStateListener { auth ->
                    currentUser = auth.currentUser
                }
                Firebase.auth.addAuthStateListener(listener)
                onDispose {
                    Firebase.auth.removeAuthStateListener(listener)
                }
            }

            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(8.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "BREAKING NEWS WALA",
                                fontWeight = FontWeight.Black,
                                color = BnwRed,
                                fontSize = 18.sp
                            )
                            Text(
                                text = "मध्य प्रदेश का सबसे तेज़ डिजिटल न्यूज़ नेटवर्क",
                                color = BnwTextSecondary,
                                fontSize = 13.sp
                            )
                        }

                        // Coins Counter
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = Color(0xFFFEF9C3),
                            border = BorderStroke(1.dp, Color(0xFFFDE047))
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("🪙", fontSize = 14.sp)
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = "$userCoins कॉइन",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp,
                                    color = Color(0xFF854D0E)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "गृह जिला: $selectedHomeDistrict • सहेजे गए लेख: $bookmarkedCount",
                        color = BnwTextTertiary,
                        fontSize = 12.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Firebase Authentication & Cloud Sync Card
            Text(
                text = "क्लाउड खाता व प्रमाणीकरण (Firebase Cloud Sync)",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = BnwTextPrimary
            )
            Spacer(modifier = Modifier.height(6.dp))

            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(8.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    val user = currentUser
                    if (user != null) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(48.dp)
                                    .clip(CircleShape)
                                    .background(BnwBlue),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = (user.displayName?.firstOrNull() ?: 'U').uppercase(),
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 20.sp
                                )
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = user.displayName ?: "सत्यापित उपयोगकर्ता",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp,
                                    color = BnwTextPrimary
                                )
                                Text(
                                    text = user.email ?: "ईमेल सुरक्षित",
                                    fontSize = 12.sp,
                                    color = BnwTextSecondary
                                )
                                Text(
                                    text = "UID: ${user.uid.take(12)}... • Firestore सिंक सक्रिय",
                                    fontSize = 11.sp,
                                    color = Color(0xFF16A34A)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        OutlinedButton(
                            onClick = {
                                GoogleAuthManager.signOut(
                                    credentialManager = credentialManager,
                                    onSignOutComplete = {
                                        Toast.makeText(context, "Google से साइन आउट किया गया", Toast.LENGTH_SHORT).show()
                                    },
                                    scope = coroutineScope
                                )
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("google_sign_out_button"),
                            shape = RoundedCornerShape(6.dp),
                            border = BorderStroke(1.dp, Color(0xFFDC2626))
                        ) {
                            Text("साइन आउट करें (Sign Out)", color = Color(0xFFDC2626), fontWeight = FontWeight.Bold)
                        }
                    } else {
                        Text(
                            text = "अतिथि सत्र (Guest Session)",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            color = BnwTextPrimary
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "अपने समाचार बुकमार्क, रिपोर्टर सबमिशन और कॉइन सुरक्षित रखने के लिए Google से साइन-इन करें।",
                            fontSize = 12.sp,
                            color = BnwTextSecondary,
                            lineHeight = 17.sp
                        )
                        Spacer(modifier = Modifier.height(12.dp))

                        Button(
                            onClick = {
                                isAuthLoading = true
                                GoogleAuthManager.onGoogleSignInClicked(
                                    context = context,
                                    credentialManager = credentialManager,
                                    onAuthSuccess = {
                                        isAuthLoading = false
                                        val newUser = Firebase.auth.currentUser
                                        if (newUser != null) {
                                            coroutineScope.launch {
                                                try {
                                                    firestoreRepo.saveUserProfile(
                                                        UserFirestoreModel(
                                                            id = newUser.uid,
                                                            displayName = newUser.displayName ?: "पाठक",
                                                            email = newUser.email ?: "",
                                                            photoUrl = newUser.photoUrl?.toString() ?: "",
                                                            role = currentRole.name,
                                                            district = selectedHomeDistrict,
                                                            state = "Madhya Pradesh"
                                                        )
                                                    )
                                                    Toast.makeText(context, "Google से सफल लॉगिन! प्रोफ़ाइल सिंक हुई।", Toast.LENGTH_SHORT).show()
                                                } catch (e: Exception) {
                                                    Toast.makeText(context, "लॉगिन सफल, प्रोफ़ाइल सिंक प्रगति पर है।", Toast.LENGTH_SHORT).show()
                                                }
                                            }
                                        }
                                    },
                                    onAuthError = { errorMsg ->
                                        isAuthLoading = false
                                        Toast.makeText(context, "साइन-इन त्रुटि: $errorMsg", Toast.LENGTH_LONG).show()
                                    },
                                    scope = coroutineScope,
                                    onAuthCancelled = {
                                        isAuthLoading = false
                                    }
                                )
                            },
                            enabled = !isAuthLoading,
                            shape = RoundedCornerShape(6.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color.White),
                            border = BorderStroke(1.dp, Color(0xFFCBD5E1)),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("google_sign_in_button")
                        ) {
                            if (isAuthLoading) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(20.dp),
                                    strokeWidth = 2.dp,
                                    color = BnwBlue
                                )
                            } else {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text("🔑", fontSize = 16.sp)
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = "Google से साइन-इन करें (Sign in with Google)",
                                        color = Color(0xFF1E293B),
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp
                                    )
                                }
                            }
                        }
                    }
                }
            }


            Spacer(modifier = Modifier.height(16.dp))

            // Role Management & Switcher Card
            Text(
                text = "भूमिका प्रबंधन (Role & Access)",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = BnwTextPrimary
            )
            Spacer(modifier = Modifier.height(6.dp))

            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(8.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "सक्रिय भूमिका (Active Role):",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = BnwTextSecondary
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    AppRole.entries.forEach { role ->
                        val isSelected = currentRole == role
                        Surface(
                            onClick = { onRoleChange(role) },
                            shape = RoundedCornerShape(6.dp),
                            color = if (isSelected) Color(0xFFEFF6FF) else Color(0xFFF8FAFC),
                            border = androidx.compose.foundation.BorderStroke(
                                width = if (isSelected) 1.5.dp else 1.dp,
                                color = if (isSelected) BnwBlue else Color(0xFFE2E8F0)
                            ),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp)
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                RadioButton(
                                    selected = isSelected,
                                    onClick = { onRoleChange(role) },
                                    colors = RadioButtonDefaults.colors(selectedColor = BnwBlue)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Column {
                                    Text(
                                        text = role.titleHi,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp,
                                        color = if (isSelected) BnwBlue else BnwTextPrimary
                                    )
                                    Text(
                                        text = role.descHi,
                                        fontSize = 11.sp,
                                        color = BnwTextSecondary
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    // Explanatory Note for Architecture & Master Admin Approval
                    Surface(
                        shape = RoundedCornerShape(6.dp),
                        color = Color(0xFFFFFBEB),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFDE68A)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text(
                                text = "💡 रोल निर्धारण व सुरक्षा व्यवस्था:",
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp,
                                color = Color(0xFF92400E)
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "1. यह ऐप डिफ़ॉल्ट रूप से 'यूज़र (पाठक)' संस्करण में ही काम करती है।\n" +
                                        "2. जब कोई नया व्यक्ति Google या मोबाइल नंबर से लॉगिन करता है, तो बैकएंड पर उसका डिफ़ॉल्ट रोल 'ROLE_READER' ही बनता है।\n" +
                                        "3. मास्टर एडमिन जब वेब एडमिन पैनल से रिपोर्टर को अप्रूव करेगा, तभी उसका खाता 'रिपोर्टर डेस्क' में अपग्रेड होता है।\n" +
                                        "4. टेस्टिंग और रिव्यू की सुविधा के लिए यहाँ ऊपर सीधा स्विच करने का विकल्प दिया गया है ताकि आप तीनों भूमिकाओं की कार्यप्रणाली तुरंत जांच सकें।",
                                fontSize = 11.sp,
                                color = Color(0xFF78350F),
                                lineHeight = 16.sp
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Notification Preferences
            Text(
                text = "अधिसूचना व प्राथमिकताएं",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = BnwTextPrimary
            )
            Spacer(modifier = Modifier.height(8.dp))

            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(8.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("ब्रेकिंग न्यूज़ अलर्ट", fontWeight = FontWeight.SemiBold, fontSize = 14.sp, color = BnwTextPrimary)
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
                            Text("ज़िला समाचार अलर्ट", fontWeight = FontWeight.SemiBold, fontSize = 14.sp, color = BnwTextPrimary)
                            Text("गृह ज़िले (भोपाल व मध्य प्रदेश) की प्रमुख खबरें", fontSize = 12.sp, color = BnwTextTertiary)
                        }
                        Switch(
                            checked = districtAlertsEnabled,
                            onCheckedChange = { districtAlertsEnabled = it },
                            colors = SwitchDefaults.colors(checkedThumbColor = BnwRed, checkedTrackColor = BnwLightRed)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Compliance & Transparency
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
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
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
                        text = "• 10-बिंदु संपादकीय तथ्य जांच प्रोटोकॉल लागू",
                        fontSize = 12.sp,
                        color = BnwTextSecondary
                    )
                }
            }
        }
    }
}
