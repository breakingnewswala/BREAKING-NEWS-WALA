package com.breakingnewswala.reporter

import com.breakingnewswala.core.auth.AuthRepository
import com.breakingnewswala.core.auth.AuthState
import com.breakingnewswala.core.model.AuthUser
import com.breakingnewswala.core.network.NetworkResult
import com.breakingnewswala.reporter.viewmodel.ReporterAuthViewModel
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class ReporterAuthViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private lateinit var mockAuthRepo: AuthRepository
    private lateinit var viewModel: ReporterAuthViewModel

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
        mockAuthRepo = mockk(relaxed = true)

        every { mockAuthRepo.currentUser } returns MutableStateFlow(null)
        every { mockAuthRepo.authState } returns MutableStateFlow(AuthState.Unauthenticated)

        viewModel = ReporterAuthViewModel(mockAuthRepo)
    }

    @After
    fun teardown() {
        Dispatchers.resetMain()
    }

    @Test
    fun testLoginSuccessWithReporterRole() = runTest {
        val reporterUser = AuthUser(
            id = "rep-101",
            fullName = "सुरेश मालवीय",
            roles = listOf("REPORTER")
        )

        coEvery { mockAuthRepo.login(any(), any()) } returns NetworkResult.Success(reporterUser)

        viewModel.login("9826012345", "Secure@123")
        testDispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertEquals(true, state.isAuthenticated)
        assertEquals("सुरेश मालवीय", state.user?.fullName)
    }

    @Test
    fun testLoginRejectsCitizenWithoutReporterRole() = runTest {
        val citizenUser = AuthUser(
            id = "cit-101",
            fullName = "सामान्य पाठक",
            roles = listOf("CITIZEN")
        )

        coEvery { mockAuthRepo.login(any(), any()) } returns NetworkResult.Success(citizenUser)

        viewModel.login("9826099999", "Reader@123")
        testDispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertEquals(false, state.isAuthenticated)
        assertTrue(state.errorMessage?.contains("अनधिकृत") == true)
    }
}

