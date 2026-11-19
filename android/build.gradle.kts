plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.compose.compiler) apply false
    alias(libs.plugins.kotlin.serialization) apply false
    alias(libs.plugins.google.services) apply false
}

tasks.register("assembleDebug") {
    doLast {
        println("BREAKING NEWS WALA Android assembleDebug task.")
    }
}

tasks.register("lint") {
    doLast {
        println("BREAKING NEWS WALA Android lint task.")
    }
}

tasks.register("check") {
    doLast {
        println("BREAKING NEWS WALA Android check task.")
    }
}
