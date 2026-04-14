use axum::{extract::State, http::StatusCode, Json};
use crate::db::AppState;

pub async fn get_certificate_detail(
    State(_state): State<AppState>,
    path: axum::extract::Path<String>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let _id = path.0;
    Err(StatusCode::NOT_IMPLEMENTED)
}

pub async fn get_certificate_by_verify_code(
    State(_state): State<AppState>,
    path: axum::extract::Path<String>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let _code = path.0;
    Err(StatusCode::NOT_IMPLEMENTED)
}
