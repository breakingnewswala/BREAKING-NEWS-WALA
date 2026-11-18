package com.breakingnewswala.auth

import android.app.Activity
import android.content.Context
import android.util.Log
import androidx.credentials.ClearCredentialStateRequest
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.NoCredentialException
import com.breakingnewswala.R
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.GoogleAuthProvider
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext

class GoogleAuthManager(private val appContext: Context) {

    private val auth: FirebaseAuth = FirebaseAuth.getInstance()
    private val credentialManager: CredentialManager = CredentialManager.create(appContext)

    fun authStateFlow(): Flow<FirebaseUser?> = callbackFlow {
        val listener = FirebaseAuth.AuthStateListener { firebaseAuth ->
            trySend(firebaseAuth.currentUser)
        }
        auth.addAuthStateListener(listener)
        trySend(auth.currentUser)
        awaitClose { auth.removeAuthStateListener(listener) }
    }

    suspend fun attemptAutoSignIn(activity: Activity): Result<FirebaseUser> {
        return try {
            val webClientId = appContext.getString(R.string.default_web_client_id)
            val googleIdOption = GetGoogleIdOption.Builder()
                .setFilterByAuthorizedAccounts(true)
                .setServerClientId(webClientId)
                .setAutoSelectEnabled(true)
                .build()

            val request = GetCredentialRequest.Builder()
                .addCredentialOption(googleIdOption)
                .build()

            val result = credentialManager.getCredential(activity, request)
            val credential = result.credential
            if (credential is CustomCredential &&
                credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL
            ) {
                val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)
                val firebaseCredential =
                    GoogleAuthProvider.getCredential(googleIdTokenCredential.idToken, null)
                val authResult = auth.signInWithCredential(firebaseCredential).await()
                val user = authResult.user
                    ?: return Result.failure(IllegalStateException("Google साइन-इन पूरा नहीं हो सका।"))
                Result.success(user)
            } else {
                Result.failure(IllegalStateException("अमान्य क्रेडेंशियल प्रकार प्राप्त हुआ।"))
            }
        } catch (e: CancellationException) {
            throw e
        } catch (e: NoCredentialException) {
            Result.failure(e)
        } catch (e: Exception) {
            Log.d("GoogleAuthManager", "Silent sign-in skipped: ${e.message}")
            Result.failure(e)
        }
    }

    suspend fun signInWithGoogle(activity: Activity): Result<FirebaseUser> {
        return try {
            val webClientId = appContext.getString(R.string.default_web_client_id)
            val signInOption = GetSignInWithGoogleOption.Builder(webClientId)
                .build()

            val request = GetCredentialRequest.Builder()
                .addCredentialOption(signInOption)
                .build()

            val result = credentialManager.getCredential(activity, request)
            val credential = result.credential
            if (credential is CustomCredential &&
                credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL
            ) {
                val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)
                val firebaseCredential =
                    GoogleAuthProvider.getCredential(googleIdTokenCredential.idToken, null)
                val authResult = auth.signInWithCredential(firebaseCredential).await()
                val user = authResult.user
                    ?: return Result.failure(IllegalStateException("Firebase उपयोगकर्ता प्राप्त नहीं हुआ।"))
                Result.success(user)
            } else {
                Result.failure(IllegalStateException("Google ID टोकन प्राप्त नहीं हो सका।"))
            }
        } catch (e: GetCredentialCancellationException) {
            Result.failure(IllegalStateException("साइन-इन रद्द किया गया। पुनः प्रयास करें।"))
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            Log.e("GoogleAuthManager", "Google Sign-In failed", e)
            Result.failure(e)
        }
    }

    suspend fun signOut(onBeforeSignOut: suspend () -> Unit = {}) {
        withContext(NonCancellable) {
            try {
                onBeforeSignOut()
            } catch (e: Exception) {
                Log.w("GoogleAuthManager", "Pre-signout cleanup warning: ${e.message}")
            }
            try {
                credentialManager.clearCredentialState(ClearCredentialStateRequest())
            } catch (e: Exception) {
                Log.w("GoogleAuthManager", "Credential state clear warning: ${e.message}")
            }
            auth.signOut()
        }
    }
}
