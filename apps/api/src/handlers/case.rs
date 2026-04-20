use axum::{extract::State, http::StatusCode, Json};
use serde::{Deserialize, Serialize};
use crate::db::AppState;

#[derive(Debug, Serialize)]
pub struct CaseResponse {
    pub id: String,
    pub status: String,
}

pub async fn list_cases(
    State(_state): State<AppState>,
) -> Result<Json<Vec<CaseResponse>>, StatusCode> {
    Err(StatusCode::NOT_IMPLEMENTED)
}

pub async fn get_case(
    State(_state): State<AppState>,
    path: axum::extract::Path<String>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let _id = path.0;
    Err(StatusCode::NOT_IMPLEMENTED)
}

#[derive(Debug, Deserialize)]
pub struct AdvanceStatusRequest {
    pub staff_id: String,
}

pub async fn advance_status(
    State(_state): State<AppState>,
    path: axum::extract::Path<String>,
    Json(_req): Json<AdvanceStatusRequest>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let _id = path.0;
    Err(StatusCode::NOT_IMPLEMENTED)
}

#[derive(Debug, Deserialize)]
pub struct VoidCaseRequest {
    pub staff_id: String,
    pub reason: String,
}

pub async fn void_case(
    State(_state): State<AppState>,
    path: axum::extract::Path<String>,
    Json(_req): Json<VoidCaseRequest>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let _id = path.0;
    Err(StatusCode::NOT_IMPLEMENTED)
}

#[derive(Debug, Deserialize)]
pub struct IssueCertificateRequest {
    pub staff_id: String,
}

pub async fn issue_certificate(
    State(_state): State<AppState>,
    path: axum::extract::Path<String>,
    Json(_req): Json<IssueCertificateRequest>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let _id = path.0;
    Err(StatusCode::NOT_IMPLEMENTED)
}
