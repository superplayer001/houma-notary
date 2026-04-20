use axum::{extract::State, http::StatusCode, Json};
use serde::{Deserialize, Serialize};
use crate::db::AppState;

#[derive(Debug, Deserialize)]
pub struct CreateApplicationRequest {
    pub biz_type: String,
    pub title: String,
}

#[derive(Debug, Serialize)]
pub struct ApplicationResponse {
    pub id: String,
    pub status: String,
}

pub async fn create_application(
    State(_state): State<AppState>,
    Json(_req): Json<CreateApplicationRequest>,
) -> Result<(StatusCode, Json<ApplicationResponse>), StatusCode> {
    Err(StatusCode::NOT_IMPLEMENTED)
}

pub async fn list_applications(
    State(_state): State<AppState>,
) -> Result<Json<Vec<ApplicationResponse>>, StatusCode> {
    Err(StatusCode::NOT_IMPLEMENTED)
}

pub async fn get_application(
    State(_state): State<AppState>,
    path: axum::extract::Path<String>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let _id = path.0;
    Err(StatusCode::NOT_IMPLEMENTED)
}

#[derive(Debug, Deserialize)]
pub struct UploadMaterialRequest {
    pub name: String,
    pub file_data: String, // base64
}

#[derive(Debug, Serialize)]
pub struct MaterialResponse {
    pub id: String,
    pub name: String,
}

pub async fn upload_material(
    State(_state): State<AppState>,
    path: axum::extract::Path<String>,
    Json(_req): Json<UploadMaterialRequest>,
) -> Result<Json<MaterialResponse>, StatusCode> {
    let _application_id = path.0;
    Err(StatusCode::NOT_IMPLEMENTED)
}

pub async fn submit_application(
    State(_state): State<AppState>,
    path: axum::extract::Path<String>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let _id = path.0;
    Err(StatusCode::NOT_IMPLEMENTED)
}

#[derive(Debug, Deserialize)]
pub struct SubmitSupplementRequest {
    pub materials: Vec<String>,
}

pub async fn submit_supplement(
    State(_state): State<AppState>,
    path: axum::extract::Path<String>,
    Json(_req): Json<SubmitSupplementRequest>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let _id = path.0;
    Err(StatusCode::NOT_IMPLEMENTED)
}

pub async fn list_pending_applications(
    State(_state): State<AppState>,
) -> Result<Json<Vec<serde_json::Value>>, StatusCode> {
    Err(StatusCode::NOT_IMPLEMENTED)
}

pub async fn get_application_for_staff(
    State(_state): State<AppState>,
    path: axum::extract::Path<String>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let _id = path.0;
    Err(StatusCode::NOT_IMPLEMENTED)
}

#[derive(Debug, Deserialize)]
pub struct RequireSupplementRequest {
    pub reason: String,
}

pub async fn require_supplement(
    State(_state): State<AppState>,
    path: axum::extract::Path<String>,
    Json(_req): Json<RequireSupplementRequest>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let _id = path.0;
    Err(StatusCode::NOT_IMPLEMENTED)
}

#[derive(Debug, Deserialize)]
pub struct RejectRequest {
    pub reason: String,
}

pub async fn reject_application(
    State(_state): State<AppState>,
    path: axum::extract::Path<String>,
    Json(_req): Json<RejectRequest>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let _id = path.0;
    Err(StatusCode::NOT_IMPLEMENTED)
}

pub async fn accept_application(
    State(_state): State<AppState>,
    path: axum::extract::Path<String>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let _id = path.0;
    Err(StatusCode::NOT_IMPLEMENTED)
}
