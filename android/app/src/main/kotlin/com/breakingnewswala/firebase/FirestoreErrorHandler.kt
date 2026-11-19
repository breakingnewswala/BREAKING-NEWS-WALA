package com.breakingnewswala.firebase

import android.util.Log
import com.google.firebase.auth.FirebaseAuth

enum class OperationType {
    CREATE,
    UPDATE,
    DELETE,
    GET,
    LIST,
    WRITE
}

fun handleFirestoreError(
    error: Exception,
    operationType: OperationType,
    path: String?
) {
    val user = FirebaseAuth.getInstance().currentUser
    val payload = buildString {
        append("{")
        append("\"error\":\"").append((error.message ?: error.toString()).replace("\"", "\\\"")).append("\",")
        append("\"operationType\":\"").append(operationType.name.lowercase()).append("\",")
        append("\"path\":\"").append(path ?: "").append("\",")
        append("\"uid\":\"").append(user?.uid ?: "").append("\"")
        append("}")
    }
    Log.e("FirestoreError", payload, error)
}
