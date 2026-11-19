package com.breakingnewswala

import android.app.Application
import com.google.firebase.firestore.FirebaseFirestore

class BnwApplication : Application() {
    val firestoreDatabaseId: String by lazy {
        getString(R.string.firestore_database_id)
    }

    val firestore: FirebaseFirestore by lazy {
        FirebaseFirestore.getInstance(firestoreDatabaseId)
    }
}
