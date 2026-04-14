//! Video Session Service
//! 
//! Handles video session business logic including creation, status management,
//! participant management, and event logging.
//! 
//! PR-11 implementation for mock video session workflow.

mod provider;

pub use provider::*;

use crate::services::audit::{AuditLog, EntityType};
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

/// Video session status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum VideoSessionStatus {
    Ready,
    InProgress,
    Completed,
    Aborted,
    Cancelled,
}

impl VideoSessionStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Ready => "READY",
            Self::InProgress => "IN_PROGRESS",
            Self::Completed => "COMPLETED",
            Self::Aborted => "ABORTED",
            Self::Cancelled => "CANCELLED",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "READY" => Some(Self::Ready),
            "IN_PROGRESS" => Some(Self::InProgress),
            "COMPLETED" => Some(Self::Completed),
            "ABORTED" => Some(Self::Aborted),
            "CANCELLED" => Some(Self::Cancelled),
            _ => None,
        }
    }
}

/// Video session event type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum VideoSessionEventType {
    Created,
    Started,
    Completed,
    Aborted,
    Cancelled,
    RecordingReady,
    Joined,
    Left,
}

impl VideoSessionEventType {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Created => "CREATED",
            Self::Started => "STARTED",
            Self::Completed => "COMPLETED",
            Self::Aborted => "ABORTED",
            Self::Cancelled => "CANCELLED",
            Self::RecordingReady => "RECORDING_READY",
            Self::Joined => "JOINED",
            Self::Left => "LEFT",
        }
    }
}

/// Participant type in a video session
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ParticipantType {
    Applicant,
    Staff,
    Witness,
}

impl ParticipantType {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Applicant => "APPLICANT",
            Self::Staff => "STAFF",
            Self::Witness => "WITNESS",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "APPLICANT" => Some(Self::Applicant),
            "STAFF" => Some(Self::Staff),
            "WITNESS" => Some(Self::Witness),
            _ => None,
        }
    }
}

/// Video session data from database
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoSession {
    pub id: Uuid,
    pub case_id: Uuid,
    pub room_id: String,
    pub status: VideoSessionStatus,
    pub scheduled_at: Option<DateTime<Utc>>,
    pub started_at: Option<DateTime<Utc>>,
    pub ended_at: Option<DateTime<Utc>>,
    pub duration_seconds: Option<i32>,
    pub recording_url: Option<String>,
    pub recording_ready: bool,
    pub max_participants: i32,
    pub created_by: Uuid,
    pub abort_reason: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Video session participant data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoSessionParticipant {
    pub id: Uuid,
    pub video_session_id: Uuid,
    pub user_id: Option<Uuid>,
    pub user_type: String,
    pub participant_type: ParticipantType,
    pub token: String,
    pub joined_at: Option<DateTime<Utc>>,
    pub left_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

/// Join information for a participant
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JoinInfo {
    pub session_id: Uuid,
    pub room_id: String,
    pub token: String,
    pub user_id: Uuid,
    pub expires_at: DateTime<Utc>,
}

/// Recording result callback data
#[derive(Debug, Clone, Deserialize)]
pub struct RecordingResult {
    pub recording_id: String,
    pub url: String,
    pub duration_seconds: i64,
}

/// Input for creating a video session
#[derive(Debug, Clone, Deserialize)]
pub struct CreateVideoSessionInput {
    pub scheduled_at: Option<DateTime<Utc>>,
    pub max_participants: Option<i32>,
}

/// Video session service
pub struct VideoService {
    pool: PgPool,
    provider: Box<dyn VideoProvider>,
}

impl VideoService {
    pub fn new(pool: PgPool, provider: Box<dyn VideoProvider>) -> Self {
        Self { pool, provider }
    }

    /// Create a new video session for a case
    pub async fn create(
        &self,
        case_id: Uuid,
        staff_id: Uuid,
        input: CreateVideoSessionInput,
    ) -> Result<VideoSession, VideoServiceError> {
        let mut tx = self.pool.begin().await.map_err(|e| {
            VideoServiceError::DatabaseError(format!("Failed to begin transaction: {}", e))
        })?;

        // 1. Verify case exists and is in correct status
        let case = sqlx::query_as::<_, (Uuid, String, String)>(
            r#"
            SELECT id, biz_type, status::text 
            FROM cases 
            WHERE id = $1
            "#,
        )
        .bind(case_id)
        .fetch_optional(&mut *tx)
        .await
        .map_err(|e| VideoServiceError::DatabaseError(e.to_string()))?;

        let case = case.ok_or(VideoServiceError::NotFound("Case not found".into()))?;
        let (_, biz_type, status) = case;

        // ENFORCEMENT must be WAITING_VIDEO
        if biz_type == "ENFORCEMENT" && status != "WAITING_VIDEO" {
            return Err(VideoServiceError::InvalidState(format!(
                "Case must be in WAITING_VIDEO status for ENFORCEMENT, current status: {}",
                status
            )));
        }

        // 2. Check no active video session exists for this case
        let existing = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT COUNT(*) 
            FROM video_sessions 
            WHERE case_id = $1 
            AND status IN ('READY', 'IN_PROGRESS')
            "#,
        )
        .bind(case_id)
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| VideoServiceError::DatabaseError(e.to_string()))?;

        if existing > 0 {
            return Err(VideoServiceError::Conflict(
                "An active video session already exists for this case".into(),
            ));
        }

        // 3. Create room with provider
        let room = self
            .provider
            .create_room(case_id, input.scheduled_at)
            .await
            .map_err(|e| VideoServiceError::ProviderError(e.to_string()))?;

        // 4. Insert video session record
        let max_participants = input.max_participants.unwrap_or(4);
        let session_id = Uuid::new_v4();
        let now = Utc::now();

        sqlx::query(
            r#"
            INSERT INTO video_sessions (
                id, case_id, room_id, status, scheduled_at, 
                max_participants, created_by, created_at, updated_at
            ) VALUES ($1, $2, $3, 'READY', $4, $5, $6, $7, $8)
            "#,
        )
        .bind(session_id)
        .bind(case_id)
        .bind(&room.room_id)
        .bind(input.scheduled_at)
        .bind(max_participants)
        .bind(staff_id)
        .bind(now)
        .bind(now)
        .execute(&mut *tx)
        .await
        .map_err(|e| VideoServiceError::DatabaseError(e.to_string()))?;

        // 5. Log event
        self.log_event(
            &mut tx,
            session_id,
            VideoSessionEventType::Created,
            Some(staff_id),
            Some("staff"),
            None,
        )
        .await?;

        // 6. Create audit log
        AuditLog::new(
            staff_id,
            EntityType::VideoSession,
            session_id,
            "VIDEO_SESSION_CREATED",
            Some(serde_json::json!({
                "case_id": case_id,
           
