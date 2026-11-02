// BREAKING NEWS WALA — Master Android Settings Configuration
// Defines multi-module project structure for Public Reader, Reporter App, and Core modules.

pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\.android.*")
                includeGroupByRegex("com\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "breaking-news-wala-android"

// Applications
include(":app-reader")
include(":app-reporter")

// Core Shared Modules
include(":core:model")
include(":core:network")
include(":core:auth")
include(":core:designsystem")
include(":core:analytics")
include(":core:notifications")
include(":core:media")
include(":core:pdf")

