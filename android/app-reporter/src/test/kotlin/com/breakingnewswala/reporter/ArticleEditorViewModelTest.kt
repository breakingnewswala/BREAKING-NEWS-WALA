package com.breakingnewswala.reporter

import com.breakingnewswala.core.media.MediaUploader
import com.breakingnewswala.core.model.*
import com.breakingnewswala.core.network.*
import com.breakingnewswala.reporter.viewmodel.ArticleEditorViewModel
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import retrofit2.Response

@OptIn(ExperimentalCoroutinesApi::class)
class ArticleEditorViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private lateinit var mockNewsApi: NewsApiService
    private lateinit var mockCategoryApi: CategoryApiService
    private lateinit var mockTerritoryApi: TerritoryApiService
    private lateinit var mockMediaUploader: MediaUploader
    private lateinit var viewModel: ArticleEditorViewModel

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)

        mockNewsApi = mockk(relaxed = true)
        mockCategoryApi = mockk(relaxed = true)
        mockTerritoryApi = mockk(relaxed = true)
        mockMediaUploader = mockk(relaxed = true)

        coEvery { mockCategoryApi.getCategories() } returns Response.success(
            ApiResponse(
                success = true,
                data = listOf(CategoryItem(id = "cat-gov", slug = "governance", nameEn = "Governance", nameHi = "प्रशासन"))
            )
        )

        coEvery { mockTerritoryApi.getMyAssignments() } returns Response.success(
            ApiResponse(
                success = true,
                data = listOf(TerritoryBeatAssignment(id = "beat-1", reporterId = "rep-1", districtId = "dist-bhopal", districtName = "भोपाल"))
            )
        )

        coEvery { mockTerritoryApi.getDistricts(any()) } returns Response.success(
            ApiResponse(
                success = true,
                data = listOf(DistrictItem(id = "dist-bhopal", slug = "bhopal", nameEn = "Bhopal", nameHi = "भोपाल", divisionId = "div-1", stateId = "st-1"))
            )
        )

        viewModel = ArticleEditorViewModel(
            newsApi = mockNewsApi,
            categoryApi = mockCategoryApi,
            territoryApi = mockTerritoryApi,
            mediaUploader = mockMediaUploader
        )
    }

    @After
    fun teardown() {
        Dispatchers.resetMain()
    }

    @Test
    fun testValidationRejectsTooShortTitle() = runTest {
        testDispatcher.scheduler.advanceUntilIdle()

        // 10 chars (under 15 char minimum - DEF-AND-01)
        viewModel.onTitleChange("ताज़ा खबर")
        viewModel.onContentChange("यह एक विस्तृत समाचार रिपोर्ट है जो पर्याप्त लंबी है।")

        viewModel.saveDraft()

        val state = viewModel.uiState.value
        assertNotNull(state.errorMessage)
        assertTrue(state.errorMessage?.contains("15") == true)
    }

    @Test
    fun testValidationRejectsTooLongTitle() = runTest {
        testDispatcher.scheduler.advanceUntilIdle()

        // 160 chars (over 150 char maximum - DEF-AND-01)
        val longTitle = "मध्य प्रदेश शासन द्वारा आज राजधानी भोपाल में आयोजित राज्यस्तरीय उच्चस्तरीय प्रशासनिक समीक्षा बैठक में सभी 55 जिलों के कलेक्टर्स और वरिष्ठ पुलिस अधिकारियों के साथ महत्वपूर्ण निर्णय लिए गए जिसमें जनहित योजनाएं शामिल हैं"
        viewModel.onTitleChange(longTitle)
        viewModel.onContentChange("यह एक विस्तृत समाचार रिपोर्ट है जो पर्याप्त लंबी है।")

        viewModel.saveDraft()

        val state = viewModel.uiState.value
        assertNotNull(state.errorMessage)
        assertTrue(state.errorMessage?.contains("150") == true)
    }

    @Test
    fun testValidationRejectsNonDevanagariTitle() = runTest {
        testDispatcher.scheduler.advanceUntilIdle()

        // Latin English only (fails Devanagari script requirement - DEF-AND-01)
        viewModel.onTitleChange("Breaking News Headline in English Only")
        viewModel.onContentChange("यह एक विस्तृत समाचार रिपोर्ट है जो पर्याप्त लंबी है।")

        viewModel.saveDraft()

        val state = viewModel.uiState.value
        assertNotNull(state.errorMessage)
        assertTrue(state.errorMessage?.contains("देवनागरी") == true)
    }

    @Test
    fun testValidationRejectsTooShortBody() = runTest {
        testDispatcher.scheduler.advanceUntilIdle()

        // Valid headline (32 chars in Devanagari)
        viewModel.onTitleChange("भोपाल में नई स्वास्थ्य नीति लागू की गई")
        // Short body (10 words, 65 chars - fails both < 50 words AND < 250 chars - DEF-AND-02)
        viewModel.onContentChange("यह खबर बहुत छोटी है और इसमें केवल दस शब्द मौजूद हैं।")

        viewModel.submitArticle()

        val state = viewModel.uiState.value
        assertNotNull(state.errorMessage)
        assertTrue(state.errorMessage?.contains("50 शब्द या 250 अक्षर") == true)
    }

    @Test
    fun testValidationAcceptsBodyWith250Chars() = runTest {
        testDispatcher.scheduler.advanceUntilIdle()

        viewModel.onTitleChange("भोपाल में नई स्वास्थ्य नीति लागू की गई")
        // Body with >= 250 chars satisfies RULE-NEWS-004 even if under 50 words
        val validCharsBody = "मध्य प्रदेश सरकार ने आज भोपाल संभाग के सभी प्राथमिक स्वास्थ्य केंद्रों के लिए नई नीति जारी की है। इस नीति के अंतर्गत ग्रामीण अंचलों में 24 घंटे आपातकालीन चिकित्सा सहायता सुनिश्चित की जाएगी तथा सभी आवश्यक दवाएं निःशुल्क उपलब्ध कराई जाएंगी। जिला प्रशासन पूर्ण सतर्क है।"
        assertTrue(validCharsBody.length >= 250)
        viewModel.onContentChange(validCharsBody)

        val draftDetail = ArticleDetail(
            id = "draft-101",
            slug = "bhopal-health-policy",
            title = "भोपाल में नई स्वास्थ्य नीति लागू की गई",
            content = validCharsBody,
            status = ArticleStatus.DRAFT,
            authorId = "rep-1",
            authorName = "सुरेश मालवीय",
            createdAt = "2026-11-02T10:00:00Z"
        )

        coEvery { mockNewsApi.createDraft(any()) } returns Response.success(
            ApiResponse(success = true, data = draftDetail)
        )
        coEvery { mockNewsApi.submitArticle("draft-101") } returns Response.success(
            ApiResponse(success = true, data = draftDetail.copy(status = ArticleStatus.PENDING_REVIEW))
        )

        viewModel.submitArticle()
        testDispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertEquals(true, state.submitSuccess)
        assertNull(state.errorMessage)
    }

    @Test
    fun testSaveDraftAndSubmitCallsApiCorrectly() = runTest {
        testDispatcher.scheduler.advanceUntilIdle()

        viewModel.onTitleChange("भोपाल में नई स्वास्थ्य नीति लागू की गई")
        val fullContent = "मध्य प्रदेश सरकार ने आज भोपाल संभाग के सभी प्राथमिक स्वास्थ्य केंद्रों के लिए नई नीति जारी की है। इस नीति के अंतर्गत ग्रामीण अंचलों में 24 घंटे आपातकालीन चिकित्सा सहायता सुनिश्चित की जाएगी तथा सभी आवश्यक दवाएं निःशुल्क उपलब्ध कराई जाएंगी। जिला कलेक्टर ने सभी चिकित्सकों को समय पर उपस्थित रहने के सख्त निर्देश दिए हैं।"
        viewModel.onContentChange(fullContent)

        val draftDetail = ArticleDetail(
            id = "draft-101",
            slug = "bhopal-health-policy",
            title = "भोपाल में नई स्वास्थ्य नीति लागू की गई",
            content = fullContent,
            status = ArticleStatus.DRAFT,
            authorId = "rep-1",
            authorName = "सुरेश मालवीय",
            createdAt = "2026-11-02T10:00:00Z"
        )

        coEvery { mockNewsApi.createDraft(any()) } returns Response.success(
            ApiResponse(success = true, data = draftDetail)
        )

        coEvery { mockNewsApi.submitArticle("draft-101") } returns Response.success(
            ApiResponse(success = true, data = draftDetail.copy(status = ArticleStatus.PENDING_REVIEW))
        )

        viewModel.submitArticle()
        testDispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertEquals(true, state.submitSuccess)
        coVerify(exactly = 1) { mockNewsApi.submitArticle("draft-101") }
    }
}
