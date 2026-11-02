// BREAKING NEWS WALA — Master Android Root Build Configuration
// Grounded in docs/DECISIONS.md (DEC-002: Pure Native Kotlin & Jetpack Compose)

plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.android.library) apply false
    alias(libs.plugins.compose.compiler) apply false
    alias(libs.plugins.kotlin.serialization) apply false
    alias(libs.plugins.kotlin.jvm) apply false
}

