package com.breakingnewswala.core.designsystem.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val BnwLightColorScheme = lightColorScheme(
    primary = BnwRed,
    onPrimary = BnwSurface,
    primaryContainer = BnwLightRed,
    onPrimaryContainer = BnwDarkRed,
    secondary = BnwBlue,
    onSecondary = BnwSurface,
    secondaryContainer = BnwLightBlue,
    onSecondaryContainer = BnwDarkBlue,
    tertiary = BnwYellow,
    onTertiary = BnwTextPrimary,
    background = BnwBackground,
    onBackground = BnwTextPrimary,
    surface = BnwSurface,
    onSurface = BnwTextPrimary,
    surfaceVariant = BnwSurfaceVariant,
    onSurfaceVariant = BnwTextSecondary,
    outline = BnwBorder,
    error = BnwError,
    onError = BnwSurface
)

@Composable
fun BnwTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = BnwLightColorScheme,
        typography = BnwTypography,
        content = content
    )
}

