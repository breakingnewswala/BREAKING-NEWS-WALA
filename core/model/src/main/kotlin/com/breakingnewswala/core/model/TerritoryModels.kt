package com.breakingnewswala.core.model

import kotlinx.serialization.Serializable

@Serializable
data class StateItem(
    val id: String,
    val slug: String,
    val nameEn: String,
    val nameHi: String,
    val code: String
)

@Serializable
data class DivisionItem(
    val id: String,
    val slug: String,
    val nameEn: String,
    val nameHi: String,
    val stateId: String
)

@Serializable
data class DistrictItem(
    val id: String,
    val slug: String,
    val nameEn: String,
    val nameHi: String,
    val divisionId: String,
    val stateId: String
)

@Serializable
data class TerritoryBeatAssignment(
    val id: String,
    val reporterId: String,
    val divisionId: String? = null,
    val districtId: String? = null,
    val divisionName: String? = null,
    val districtName: String? = null,
    val beatType: String = "DISTRICT",
    val status: String = "ACTIVE",
    val trustScore: Int = 100
)

@Serializable
data class TerritoryOverview(
    val state: StateItem,
    val totalDivisions: Int,
    val totalDistricts: Int,
    val divisions: List<DivisionItem> = emptyList(),
    val districts: List<DistrictItem> = emptyList()
)

