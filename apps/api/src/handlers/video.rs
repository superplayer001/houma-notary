use axum::{extract::State, http::StatusCode, Json};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::db::AppState;
use crate::services::video::{CreateVideoSessionInput, VideoService};

#[derive(Debug, Deserialize)]
pub struct CreateVideoSessionRequest {
    pub scheduled_at: Option<String>,
    pub applicant_display_name: String,
    pub applicant_ref_id: String,
}

#[derive(Debug, Serialize)]
pub struct CreateVideoSessionResponse {
    pub id: String,
}

pub async fn create_video_session(
    state: State<AppState>,
    path: axum::extract::Path<String>,
    json: Json<CreateVideoSessionRequest>,
) -> impl axum::response::IntoResponse {
    let case_id = match Uuid::parse_str(&path.0) {
        Ok(id) => id,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error": "invalid case id"}))),
    };
    let applicant_ref_id = match Uuid::parse_str(&json.applicant_ref_id) {
        Ok(id) => id,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error": "invalid applicant ref id"}))),
    };
    let input = CreateVideoSessionInput {
        case_id,
        staff_id: Uuid::nil(),
        staff_display_name: "System Admin".to_string(),
        scheduled_at: None,
        applicant_display_name: json.applicant_display_name.clone(),
        applicant_ref_id,
    };
    let service = VideoService::new();
    match service.create_video_session(&state.pool, input).await {
        Ok(result) => (StatusCode::CREATED, Json(serde_json::json!({"id": result.video_session.id.to_string(), "room_id": result.video_session.room_id}))),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))),
    }
}

pub async fn get_video_session(
    state: State<AppState>,
    path: axum::extract::Path<String>,
) -> impl axum::response::IntoResponse {
    let session_id = match Uuid::parse_str(&path.0) {
        Ok(id) => id,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error": "invalid session id"}))),
    };
    let service = VideoService::new();
    match service.get_video_session_detail(&state.pool, session_id).await {
        Ok(Some(result)) => (StatusCode::OK, Json(serde_json::json!({
            "id": result.video_session.id.to_string(),
            "status": result.video_session.status,
            "room_id": result.video_session.room_id
        }))),
        Ok(None) => (StatusCode::NOT_FOUND, Json(serde_json::json!({"error": "not found"}))),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))),
    }
}

#[derive(Debug, Deserialize)]
pub struct StartVideoSessionRequest {
    pub staff_id: String,
}

pub async fn start_video_session(
    state: State<AppState>,
    path: axum::extract::Path<String>,
    json: Json<StartVideoSessionRequest>,
) -> impl axum::response::IntoResponse {
    let session_id = match Uuid::parse_str(&path.0) {
        Ok(id) => id,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error": "invalid session id"}))),
    };
    let staff_id = match Uuid::parse_str(&json.staff_id) {
        Ok(id) => id,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error": "invalid staff id"}))),
    };
    let service = VideoService::new();
    match service.start_video_session(&state.pool, session_id, staff_id).await {
        Ok(result) => (StatusCode::OK, Json(serde_json::json!({"id": result.video_session.id.to_string(), "status": result.video_session.status}))),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))),
    }
}

#[derive(Debug, Deserialize)]
pub struct CompleteVideoSessionRequest {
    pub staff_id: String,
}

pub async fn complete_video_session(
    state: State<AppState>,
    path: axum::extract::Path<String>,
    json: Json<CompleteVideoSessionRequest>,
) -> impl axum::response::IntoResponse {
    let session_id = match Uuid::parse_str(&path.0) {
        Ok(id) => id,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error": "invalid session id"}))),
    };
    let staff_id = match Uuid::parse_str(&json.staff_id) {
        Ok(id) => id,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error": "invalid staff id"}))),
    };
    let service = VideoService::new();
    match service.complete_video_session(&state.pool, session_id, staff_id).await {
        Ok(result) => (StatusCode::OK, Json(serde_json::json!({"id": result.video_session.id.to_string(), "status": result.video_session.status, "recording_url": result.video_session.recording_url}))),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))),
    }
}

#[derive(Debug, Deserialize)]
pub struct AbortVideoSessionRequest {
    pub staff_id: String,
    pub reason: Option<String>,
}

pub async fn abort_video_session(
    state: State<AppState>,
    path: axum::extract::Path<String>,
    json: Json<AbortVideoSessionRequest>,
) -> impl axum::response::IntoResponse {
    let session_id = match Uuid::parse_str(&path.0) {
        Ok(id) => id,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error": "invalid session id"}))),
    };
    let staff_id = match Uuid::parse_str(&json.staff_id) {
        Ok(id) => id,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error": "invalid staff id"}))),
    };
    let service = VideoService::new();
    match service.abort_video_session(&state.pool, session_id, staff_id, json.reason.clone()).await {
        Ok(result) => (StatusCode::OK, Json(serde_json::json!({"id": result.video_session.id.to_string(), "status": result.video_session.status}))),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))),
    }
}

#[derive(Debug, Deserialize)]
pub struct GetJoinInfoQuery {
    pub token: String,
}

#[derive(Debug, Serialize)]
pub struct JoinInfoResponse {
    pub session_id: String,
    pub room_id: String,
    pub participant_type: String,
    pub display_name: String,
}

pub async fn get_join_info(
    state: State<AppState>,
    path: axum::extract::Path<String>,
    query: axum::extract::Query<GetJoinInfoQuery>,
) -> impl axum::response::IntoResponse {
    let session_id = match Uuid::parse_str(&path.0) {
        Ok(id) => id,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error": "invalid session id"}))),
    };
    let service = VideoService::new();
    match service.get_join_info(&state.pool, session_id, &query.token).await {
        Ok(Some((session, participant))) => (StatusCode::OK, Json(serde_json::json!({
            "session_id": session.id.to_string(),
            "room_id": session.room_id,
            "participant_type": participant.participant_type,
            "display_name": participant.display_name
        }))),
        Ok(None) => (StatusCode::UNAUTHORIZED, Json(serde_json::json!({"error": "invalid or expired token"}))),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))),
    }
}

#[derive(Debug, Deserialize)]
pub struct ReportRecordingResultRequest {
    pub recording_url: String,
    pub operator_id: String,
}

pub async fn report_recording_result(
    state: State<AppState>,
    path: axum::extract::Path<String>,
    json: Json<ReportRecordingResultRequest>,
) -> impl axum::response::IntoResponse {
    let session_id = match Uuid::parse_str(&path.0) {
        Ok(id) => id,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error": "invalid session id"}))),
    };
    let operator_id = match Uuid::parse_str(&json.operator_id) {
        Ok(id) => id,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error": "invalid operator id"}))),
    };
    let service = VideoService::new();
    match service.report_recording_result(&state.pool, session_id, &json.recording_url, operator_id).await {
        Ok(result) => (StatusCode::OK, Json(serde_json::json!({"id": result.video_session.id.to_string(), "recording_ready": result.video_session.recording_ready}))),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))),
    }
}
