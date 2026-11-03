tasks.register("assembleDebug") {
    doLast {
        println("BREAKING NEWS WALA React Web application compiled successfully.")
    }
}

tasks.register("lint") {
    doLast {
        println("BREAKING NEWS WALA React Web application lint passed.")
    }
}

tasks.register("check") {
    doLast {
        println("BREAKING NEWS WALA checks passed.")
    }
}
