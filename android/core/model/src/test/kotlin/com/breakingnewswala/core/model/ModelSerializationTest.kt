package com.breakingnewswala.core.model

import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

class ModelSerializationTest {

    private val json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
    }

    @Test
    fun testArticleItemSerialization() {
        val article = ArticleItem(
            id = "art-101",
            slug = "bhopal-metro-update",
            title = "भोपाल मेट्रो विस्तार को मिली मंजूरी",
            summary = "मध्य प्रदेश मंत्रिमंडल ने भोपाल मेट्रो के नए कॉरिडोर को मंजूरी दी।",
            status = ArticleStatus.PUBLISHED,
            isBreaking = true,
            viewCount = 1500
        )

        val serialized = json.encodeToString(article)
        val deserialized = json.decodeFromString<ArticleItem>(serialized)

        assertEquals("art-101", deserialized.id)
        assertEquals("भोपाल मेट्रो विस्तार को मिली मंजूरी", deserialized.title)
        assertTrue(deserialized.isBreaking)
        assertEquals(ArticleStatus.PUBLISHED, deserialized.status)
    }

    @Test
    fun testAuthResponseSerialization() {
        val authData = AuthResponseData(
            user = AuthUser(
                id = "usr-1",
                fullName = "राजेश शर्मा",
                roles = listOf("REPORTER")
            ),
            tokens = AuthTokens(
                accessToken = "jwt-access-token",
                refreshToken = "jwt-refresh-token",
                expiresInSeconds = 900
            )
        )

        val serialized = json.encodeToString(authData)
        val deserialized = json.decodeFromString<AuthResponseData>(serialized)

        assertEquals("राजेश शर्मा", deserialized.user.fullName)
        assertEquals("REPORTER", deserialized.user.roles.first())
        assertEquals("jwt-access-token", deserialized.tokens.accessToken)
    }

    @Test
    fun testApiResponseSerialization() {
        val response = ApiResponse(
            success = true,
            data = listOf("bhopal", "indore", "jabalpur")
        )

        val serialized = json.encodeToString(response)
        val deserialized = json.decodeFromString<ApiResponse<List<String>>>(serialized)

        assertTrue(deserialized.success)
        assertNotNull(deserialized.data)
        assertEquals(3, deserialized.data?.size)
    }
}

