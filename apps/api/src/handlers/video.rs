use axum::{extract::Extension, http::StatusCode, Json};
use sqlx::PgPool;
use uuid::Uuid;
use crate::services::video::{VideoService, CreateVideoSessionInput};

#[derive(Debug, serde::Deserialize)] pub struct CreateVideoSessionRequest {
    pub scheduled_at: Option<String>,
    pub applicant_display_name: String,
    pub applicant_ref_id: String,
}

pub async fn create_video_session(
    pool: Extension<PgPool>,
    path: axum::extract::Path<String>,
    json: Json<CreateVideoSessionRequest>,
) -> impl axum::response::IntoResponse {
    let case_id = Uuid::parse_str(&path.0).map_err(|_| (StatusCode::BAD_REQUEST, "invalid case id")).unwrap();
    let input = CreateVideoSessionInput {
        case_id,
        staff_id: Uuid::nil(),
        staff_display_name: "System Admin".to_string(),
        scheduled_at: None,
        applicant_display_name: json.applicant_display_name.clone(),
        applicant_ref_id: json.applicant_ref_id.clone(),
    };
    let service = VideoService::new();
    match service.create_video_session(&pool, input).await {
        Ok(result) => (StatusCode::CREATED, Json(serde_json::json!({"id": result.video_session.id}))),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))),
    }
}

pub async fn get_video_session(pool: Extension<PgPool>, path: axum::extract::Path<String>) -> impl axum::response::IntoResponse {
    let session_id = Uuid::parse_str(&path.0).map_err(|_| (StatusCode::BAD_REQUEST, "invalid session id")).unwrap();
    let service = VideoService::new();
    match service.get_video_session_detail(&pool, session_id).await {
        Ok(Some(result)) => (StatusCode::OK, Json(serde_json::json!({"id": result.video_session.id, "status": result.video_session.status}))),
        Ok(None) => (StatusCode::NOT_FOUND, Json(serde_json::json!({"error": "not found"}))),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))),
    }
}
