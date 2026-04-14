// Video Session Handlers for PR-11
// HTTP handlers for video session operations

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

use crate::services::video::{
    CreateVideoSessionInput, VideoService, VideoSessionWithDetails,
};

pub struct AppState {
    pub pool: PgPool,
    pub video_service: VideoService,
}

// Request/Response types
#[derive(Debug, Deserialize)]
pub struct CreateVideoSessionRequest {
    pub case_id: Uuid,
    pub staff_display_name: String,
    pub scheduled_at: Option<chrono::DateTime<chrono::Utc>>,
    pub applicant_display_name: String,
    pub applicant_ref_id: String,
}

#[derive(Debug, Deserialize)]
pub struct StartVideoSessionRequest {
    pub comment: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CompleteVideoSessionRequest {
    pub comment: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AbortVideoSessionRequest {
    pub comment: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct JoinInfoQuery {
    pub token: String,
}

#[derive(Debug, Deserialize)]
pub struct ReportRecordingRequest {
    pub recording_url: String,
    pub recording_hash: String,
}

#[derive(Debug, Serialize)]
pub struct VideoSessionResponse {
    pub id: Uuid,
    pub case_id: Uuid,
    pub room_id: String,
    pub status: String,
    pub scheduled_at: Option<chrono::DateTime<chrono::Utc>>,
    pub started_at: Option<chrono::DateTime<chrono::Utc>>,
    pub ended_at: Option<chrono::DateTime<chrono::Utc>>,
    pub recording_url: Option<String>,
    pub recording_ready: bool,
    pub participants: Vec<ParticipantResponse>,
}

#[derive(Debug, Serialize)]
pub struct ParticipantResponse {
    pub id: Uuid,
    pub participant_type: String,
    pub display_name: String,
    pub join_token: String,
    pub joined_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, Serialize)]
pub struct JoinInfoResponse {
    pub session_id: Uuid,
    pub room_id: String,
    pub token: String,
    pub participant_type: String,
    pub display_name: String,
}

impl From<VideoSessionWithDetails> for VideoSessionResponse {
    fn from(details: VideoSessionWithDetails) -> Self {
        Self {
            id: details.video_session.id,
            case_id: details.video_session.case_id,
            room_id: details.video_session.room_id,
            status: details.video_session.status,
            scheduled_at: details.video_session.scheduled_at,
            started_at: details.video_session.started_at,
            ended_at: details.video_session.ended_at,
            recording_url: details.video_session.recording_url,
            recording_ready: details.video_session.recording_url.is_some(),
            participants: details
                .participants
                .into_iter()
                .map(|p| ParticipantResponse {
                    id: p.id,
                    participant_type: p.participant_type,
                    display_name: p.display_name,
                    join_token: p.join_token,
                    joined_at: p.joined_at,
                })
                .collect(),
        }
    }
}

// Handler: Create video session
// POST /api/v1/staff/cases/:id/video-sessions
pub async fn create_video_session(
    State(state): State<AppState>,
    Path(case_id): Path<Uuid>,
    Json(req): Json<CreateVideoSessionRequest>,
) -> impl IntoResponse {
    let input = CreateVideoSessionInput {
        case_id,
        staff_id: Uuid::nil(), // TODO: get from auth
        staff_display_name: req.staff_display_name,
        scheduled_at: req.scheduled_at,
        applicant_display_name: req.applicant_display_name,
        applicant_ref_id: req.applicant_ref_id,
    };

    match state
        .video_service
        .create_video_session(&state.pool, input)
        .await
    {
        Ok(details) => {
            let response: VideoSessionResponse = details.into();
            (StatusCode::CREATED, Json(response)).into_response()
        }
        Err(e) => {
            tracing::error!("Failed to create video session: {:?}", e);
            (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error": e.to_string()}))).into_response()
        }
    }
}

// Handler: Get video session
// GET /api/v1/staff/video-sessions/:id
pub async fn get_video_session(
    State(state): State<AppState>,
    Path(session_id): Path<Uuid>,
) -> impl IntoResponse {
    match state
        .video_service
        .get_video_session_detail(&state.pool, session_id)
        .await
    {
        Ok(Some(details)) => {
            let response: VideoSessionResponse = details.into();
            (StatusCode::OK, Json(response)).into_response()
        }
        Ok(None) => {
            (StatusCode::NOT_FOUND, Json(serde_json::json!({"error": "Video session not found"}))).into_response()
        }
        Err(e) => {
            tracing::error!("Failed to get video session: {:?}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))).into_response()
        }
    }
}

// Handler: Start video session
// POST /api/v1/staff/video-sessions/:id/start
pub async fn start_video_session(
    State(state): State<AppState>,
    Path(session_id): Path<Uuid>,
    Json(req): Json<StartVideoSessionRequest>,
) -> impl IntoResponse {
    let staff_id = Uuid::nil(); // TODO: get from auth

    match state
        .video_service
        .start_video_session(&state.pool, session_id, staff_id, req.comment)
        .await
    {
        Ok(details) => {
            let response: VideoSessionResponse = details.into();
            (StatusCode::OK, Json(response)).into_response()
        }
        Err(e) => {
            tracing::error!("Failed to start video session: {:?}", e);
            let status = if matches!(e, crate::services::video::VideoSessionError::InvalidStatusTransition) {
                StatusCode::CONFLICT
            } else {
                StatusCode::BAD_REQUEST
            };
            (status, Json(serde_json::json!({"error": e.to_string()}))).into_response()
        }
    }
}

// Handler: Complete video session
// POST /api/v1/staff/video-sessions/:id/complete
pub async fn complete_video_session(
    State(state): State<AppState>,
    Path(session_id): Path<Uuid>,
    Json(req): Json<CompleteVideoSessionRequest>,
) -> impl IntoResponse {
    let staff_id = Uuid::nil(); // TODO: get from auth

    match state
        .video_service
        .complete_video_session(&state.pool, session_id, staff_id, req.comment)
        .await
    {
        Ok(details) => {
            let response: VideoSessionResponse = details.into();
            (StatusCode::OK, Json(response)).into_response()
        }
        Err(e) => {
            tracing::error!("Failed to complete video session: {:?}", e);
            let status = if matches!(e, crate::services::video::VideoSessionError::InvalidStatusTransition) {
                StatusCode::CONFLICT
            } else {
                StatusCode::BAD_REQUEST
            };
            (status, Json(serde_json::json!({"error": e.to_string()}))).into_response()
        }
    }
}

// Handler: Abort video session
// POST /api/v1/staff/video-sessions/:id/abort
pub async fn abort_video_session(
    State(state): State<AppState>,
    Path(session_id): Path<Uuid>,
    Json(req): Json<AbortVideoSessionRequest>,
) -> impl IntoResponse {
    let staff_id = Uuid::nil(); // TODO: get from auth

    match state
        .video_service
        .abort_video_session(&state.pool, session_id, staff_id, req.comment)
        .await
    {
        Ok(details) => {
            let response: VideoSessionResponse = details.into();
            (StatusCode::OK, Json(response)).into_response()
        }
        Err(e) => {
            tracing::error!("Failed to abort video session: {:?}", e);
            let status = if matches!(e, crate::services::video::VideoSessionError::InvalidStatusTransition) {
                StatusCode::CONFLICT
            } else {
       
