use axum::{
    extract::State,
    http::StatusCode,
    Json,
};
use crate::db::AppState;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct UserLoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct StaffLoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub user_id: String,
}

pub async fn user_login(
    State(_state): State<AppState>,
    Json(_req): Json<UserLoginRequest>,
) -> Result<Json<LoginResponse>, StatusCode> {
    Err(StatusCode::NOT_IMPLEMENTED)
}

pub async fn staff_login(
    State(_state): State<AppState>,
    Json(_req): Json<StaffLoginRequest>,
) -> Result<Json<LoginResponse>, StatusCode> {
    Err(StatusCode::NOT_IMPLEMENTED)
}

#[derive(Debug, Serialize)]
pub struct UserMeResponse {
    pub id: String,
    pub display_name: String,
}

#[derive(Debug, Serialize)]
pub struct StaffMeResponse {
    pub id: String,
    pub display_name: String,
    pub role: String,
}

pub async fn user_me(
    State(_state): State<AppState>,
) -> Result<Json<UserMeResponse>, StatusCode> {
    Err(StatusCode::NOT_IMPLEMENTED)
}

pub async fn staff_me(
    State(_state): State<AppState>,
) -> Result<Json<StaffMeResponse>, StatusCode> {
    Err(StatusCode::NOT_IMPLEMENTED)
}
