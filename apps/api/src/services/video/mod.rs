pub mod provider;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Postgres, Transaction};
use uuid::Uuid;

pub use provider::{MockVideoProvider, VideoProvider};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum VideoSessionStatus {
    Ready,
    InProgress,
    Completed,
    Aborted,
    Cancelled,
}

impl VideoSessionStatus {
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
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Ready => "READY",
            Self::InProgress => "IN_PROGRESS",
            Self::Completed => "COMPLETED",
            Self::Aborted => "ABORTED",
            Self::Cancelled => "CANCELLED",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
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

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ParticipantType {
    Applicant,
    Staff,
    Witness,
}

impl ParticipantType {
    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "APPLICANT" => Some(Self::Applicant),
            "STAFF" => Some(Self::Staff),
            "WITNESS" => Some(Self::Witness),
            _ => None,
        }
    }
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Applicant => "APPLICANT",
            Self::Staff => "STAFF",
            Self::Witness => "WITNESS",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct VideoSession {
    pub id: Uuid,
    pub case_id: Uuid,
    pub room_id: String,
    pub status: String,
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

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct VideoSessionParticipant {
    pub id: Uuid,
    pub video_session_id: Uuid,
    pub participant_type: String,
    pub participant_id: Uuid,
    pub display_name: String,
    pub join_token: String,
    pub token_expired_at: Option<DateTime<Utc>>,
    pub joined_at: Option<DateTime<Utc>>,
    pub left_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct VideoSessionEvent {
    pub id: Uuid,
    pub video_session_id: Uuid,
    pub event_type: String,
    pub operator_type: Option<String>,
    pub operator_id: Option<Uuid>,
    pub detail_json: serde_json::Value,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug)]
pub struct CreateVideoSessionInput {
    pub case_id: Uuid,
    pub staff_id: Uuid,
    pub staff_display_name: String,
    pub scheduled_at: Option<DateTime<Utc>>,
    pub applicant_display_name: String,
    pub applicant_ref_id: Uuid,
}

#[derive(Debug, Clone, Serialize)]
pub struct VideoSessionWithDetails {
    pub video_session: VideoSession,
    pub participants: Vec<VideoSessionParticipant>,
}

#[derive(Debug, thiserror::Error)]
pub enum VideoSessionError {
    #[error("Case not found")]
    CaseNotFound,
    #[error("Case not in video stage")]
    CaseNotInVideoStage,
    #[error("Video session already exists")]
    VideoSessionAlreadyExists,
    #[error("Video session not found")]
    VideoSessionNotFound,
    #[error("Invalid status transition")]
    InvalidStatusTransition,
    #[error("Database error: {0}")]
    DbError(#[from] sqlx::Error),
    #[error("Provider error: {0}")]
    ProviderError(String),
}

pub struct VideoService {
    provider: MockVideoProvider,
}

impl VideoService {
    pub fn new() -> Self {
        Self {
            provider: MockVideoProvider::new(),
        }
    }

    pub async fn create_video_session(
        &self,
        pool: &PgPool,
        input: CreateVideoSessionInput,
    ) -> Result<VideoSessionWithDetails, VideoSessionError> {
        let room_info = self.provider.create_room(input.case_id).await
            .map_err(|e| VideoSessionError::ProviderError(e.to_string()))?;

        let mut tx = pool.begin().await?;
        let now = Utc::now();

        let video_session: VideoSession = sqlx::query_as(
            r#"
            INSERT INTO video_sessions (case_id, room_id, status, scheduled_at, created_by, created_at, updated_at)
            VALUES ($1, $2, 'READY', $3, $4, $5, $5)
            RETURNING id, case_id, room_id, status, scheduled_at, started_at, ended_at, duration_seconds, recording_url, recording_ready, max_participants, created_by, abort_reason, created_at, updated_at
            "#,
        )
        .bind(input.case_id)
        .bind(&room_info.room_id)
        .bind(input.scheduled_at)
        .bind(input.staff_id)
        .bind(now)
        .fetch_one(&mut *tx)
        .await?;

        let staff_token = self.provider.issue_participant_token(
            video_session.id, "STAFF", &input.staff_id.to_string()
        ).await.map_err(|e| VideoSessionError::ProviderError(e.to_string()))?;

        let applicant_token = self.provider.issue_participant_token(
            video_session.id, "APPLICANT", &input.applicant_ref_id.to_string()
        ).await.map_err(|e| VideoSessionError::ProviderError(e.to_string()))?;

        let staff_participant: VideoSessionParticipant = sqlx::query_as(
            r#"
            INSERT INTO video_session_participants (video_session_id, participant_type, participant_id, display_name, join_token, token_expired_at, created_at)
            VALUES ($1, 'STAFF', $2, $3, $4, $5, $6)
            RETURNING id, video_session_id, participant_type, participant_id, display_name, join_token, token_expired_at, joined_at, left_at, created_at
            "#,
        )
        .bind(video_session.id)
        .bind(input.staff_id)
        .bind(&input.staff_display_name)
        .bind(&staff_token.token)
        .bind(staff_token.expired_at)
        .bind(now)
        .fetch_one(&mut *tx)
        .await?;

        let applicant_participant: VideoSessionParticipant = sqlx::query_as(
            r#"
            INSERT INTO video_session_participants (video_session_id, participant_type, participant_id, display_name, join_token, token_expired_at, created_at)
            VALUES ($1, 'APPLICANT', $2, $3, $4, $5, $6)
            RETURNING id, video_session_id, participant_type, participant_id, display_name, join_token, token_expired_at, joined_at, left_at, created_at
            "#,
        )
        .bind(video_session.id)
        .bind(input.applicant_ref_id)
        .bind(&input.applicant_display_name)
        .bind(&applicant_token.token)
        .bind(applicant_token.expired_at)
        .bind(now)
        .fetch_one(&mut *tx)
        .await?;

        let _: VideoSessionEvent = sqlx::query_as(
            r#"
            INSERT INTO video_session_events (video_session_id, event_type, operator_type, operator_id, detail_json, created_at)
            VALUES ($1, 'CREATED', 'STAFF', $2, $3, $4)
            RETURNING id, video_session_id, event_type, operator_type, operator_id, detail_json, created_at
            "#,
        )
        .bind(video_session.id)
        .bind(input.staff_id)
        .bind(serde_json::json!({"room_id": room_info.room_id}))
        .bind(now)
        .fetch_one(&mut *tx)
        .await?;

        tx.commit().await?;

        Ok(VideoSessionWithDetails {
            video_session,
            participants: vec![staff_participant, applicant_participant],
        })
    }

    pub async fn get_video_session_detail(
        &self,
        pool: &PgPool,
        video_session_id: Uuid,
    ) -> Result<Option<VideoSessionWithDetails>, VideoSessionError> {
        let video_session: Option<VideoSession> = sqlx::query_as(
            "SELECT id, case_id, room_id, status, scheduled_at, started_at, ended_at, duration_seconds, recording_url, recording_ready, max_participants, created_by, abort_reason, created_at, updated_at FROM video_sessions WHERE id = $1"
        )
        .bind(video_session_id)
        .fetch_optional(pool)
        .await?;

        let video_session = match video_session {
            Some(vs) => vs,
            None => return Ok(None),
        };

        let participants: Vec<VideoSessionParticipant> = sqlx::query_as(
            "SELECT id, video_session_id, participant_type, participant_id, display_name, join_token, token_expired_at, joined_at, left_at, created_at FROM video_session_participants WHERE video_session_id = $1 ORDER BY created_at ASC"
        )
        .bind(video_session_id)
        .fetch_all(pool)
        .await?;

        Ok(Some(VideoSessionWithDetails {
            video_session,
            participants,
        }))
    }

    pub async fn start_video_session(
        &self,
        pool: &PgPool,
        video_session_id: Uuid,
        staff_id: Uuid,
    ) -> Result<VideoSessionWithDetails, VideoSessionError> {
        let vs = self.get_video_session_by_id(pool, video_session_id).await?
            .ok_or(VideoSessionError::VideoSessionNotFound)?;

        if vs.status != VideoSessionStatus::Ready.as_str() {
            return Err(VideoSessionError::InvalidStatusTransition);
        }

        self.provider.start_recording(video_session_id, &vs.room_id).await
            .map_err(|e| VideoSessionError::ProviderError(e.to_string()))?;

        let mut tx = pool.begin().await?;
        let now = Utc::now();

        let _: VideoSession = sqlx::query_as(
            r#"
            UPDATE video_sessions SET status = 'IN_PROGRESS', started_at = $1, updated_at = $2 WHERE id = $3
            RETURNING id, case_id, room_id, status, scheduled_at, started_at, ended_at, duration_seconds, recording_url, recording_ready, max_participants, created_by, abort_reason, created_at, updated_at
            "#,
        )
        .bind(now)
        .bind(now)
        .bind(video_session_id)
        .fetch_one(&mut *tx)
        .await?;

        let _: VideoSessionEvent = sqlx::query_as(
            r#"
            INSERT INTO video_session_events (video_session_id, event_type, operator_type, operator_id, detail_json, created_at)
            VALUES ($1, 'STARTED', 'STAFF', $2, '{}', $3)
            RETURNING id, video_session_id, event_type, operator_type, operator_id, detail_json, created_at
            "#,
        )
        .bind(video_session_id)
        .bind(staff_id)
        .bind(now)
        .fetch_one(&mut *tx)
        .await?;

        tx.commit().await?;
        self.get_video_session_detail(pool, video_session_id).await?
            .ok_or(VideoSessionError::VideoSessionNotFound)
    }

    pub async fn complete_video_session(
        &self,
        pool: &PgPool,
        video_session_id: Uuid,
        staff_id: Uuid,
    ) -> Result<VideoSessionWithDetails, VideoSessionError> {
        let vs = self.get_video_session_by_id(pool, video_session_id).await?
            .ok_or(VideoSessionError::VideoSessionNotFound)?;

        if vs.status != VideoSessionStatus::InProgress.as_str() {
            return Err(VideoSessionError::InvalidStatusTransition);
        }

        let recording_result = self.provider.stop_recording(video_session_id, &vs.room_id).await
            .map_err(|e| VideoSessionError::ProviderError(e.to_string()))?;

        self.provider.close_room(video_session_id, &vs.room_id).await
            .map_err(|e| VideoSessionError::ProviderError(e.to_string()))?;

        let mut tx = pool.begin().await?;
        let now = Utc::now();
        let duration = vs.started_at.map(|started| (now - started).num_seconds() as i32);

        let _: VideoSession = sqlx::query_as(
            r#"
            UPDATE video_sessions SET status = 'COMPLETED', ended_at = $1, duration_seconds = $2, recording_url = $3, recording_ready = TRUE, updated_at = $4 WHERE id = $5
            RETURNING id, case_id, room_id, status, scheduled_at, started_at, ended_at, duration_seconds, recording_url, recording_ready, max_participants, created_by, abort_reason, created_at, updated_at
            "#,
        )
        .bind(now)
        .bind(duration)
        .bind(&recording_result.recording_url)
        .bind(now)
        .bind(video_session_id)
        .fetch_one(&mut *tx)
        .await?;

        let _: VideoSessionEvent = sqlx::query_as(
            r#"
            INSERT INTO video_session_events (video_session_id, event_type, operator_type, operator_id, detail_json, created_at)
            VALUES ($1, 'COMPLETED', 'STAFF', $2, $3, $4)
            RETURNING id, video_session_id, event_type, operator_type, operator_id, detail_json, created_at
            "#,
        )
        .bind(video_session_id)
        .bind(staff_id)
        .bind(serde_json::json!({"recording_url": recording_result.recording_url}))
        .bind(now)
        .fetch_one(&mut *tx)
        .await?;

        tx.commit().await?;
        self.get_video_session_detail(pool, video_session_id).await?
            .ok_or(VideoSessionError::VideoSessionNotFound)
    }

    pub async fn abort_video_session(
        &self,
        pool: &PgPool,
        video_session_id: Uuid,
        staff_id: Uuid,
        reason: Option<String>,
    ) -> Result<VideoSessionWithDetails, VideoSessionError> {
        let vs = self.get_video_session_by_id(pool, video_session_id).await?
            .ok_or(VideoSessionError::VideoSessionNotFound)?;

        if vs.status == VideoSessionStatus::Completed.as_str()
            || vs.status == VideoSessionStatus::Cancelled.as_str() {
            return Err(VideoSessionError::InvalidStatusTransition);
        }

        self.provider.close_room(video_session_id, &vs.room_id).await
            .map_err(|e| VideoSessionError::ProviderError(e.to_string()))?;

        let mut tx = pool.begin().await?;
        let now = Utc::now();

        let _: VideoSession = sqlx::query_as(
            r#"
            UPDATE video_sessions SET status = 'ABORTED', ended_at = $1, abort_reason = $2, updated_at = $3 WHERE id = $4
            RETURNING id, case_id, room_id, status, scheduled_at, started_at, ended_at, duration_seconds, recording_url, recording_ready, max_participants, created_by, abort_reason, created_at, updated_at
            "#,
        )
        .bind(now)
        .bind(&reason)
        .bind(now)
        .bind(video_session_id)
        .fetch_one(&mut *tx)
        .await?;

        let _: VideoSessionEvent = sqlx::query_as(
            r#"
            INSERT INTO video_session_events (video_session_id, event_type, operator_type, operator_id, detail_json, created_at)
            VALUES ($1, 'ABORTED', 'STAFF', $2, $3, $4)
            RETURNING id, video_session_id, event_type, operator_type, operator_id, detail_json, created_at
            "#,
        )
        .bind(video_session_id)
        .bind(staff_id)
        .bind(serde_json::json!({"reason": reason}))
        .bind(now)
        .fetch_one(&mut *tx)
        .await?;

        tx.commit().await?;
        self.get_video_session_detail(pool, video_session_id).await?
            .ok_or(VideoSessionError::VideoSessionNotFound)
    }

    pub async fn get_join_info(
        &self,
        pool: &PgPool,
        video_session_id: Uuid,
        token: &str,
    ) -> Result<Option<(VideoSession, VideoSessionParticipant)>, VideoSessionError> {
        let vs: Option<VideoSession> = sqlx::query_as(
            "SELECT id, case_id, room_id, status, scheduled_at, started_at, ended_at, duration_seconds, recording_url, recording_ready, max_participants, created_by, abort_reason, created_at, updated_at FROM video_sessions WHERE id = $1"
        )
        .bind(video_session_id)
        .fetch_optional(pool)
        .await?;

        let vs = match vs {
            Some(v) => v,
            None => return Ok(None),
        };

        let participant: Option<VideoSessionParticipant> = sqlx::query_as(
            "SELECT id, video_session_id, participant_type, participant_id, display_name, join_token, token_expired_at, joined_at, left_at, created_at FROM video_session_participants WHERE video_session_id = $1 AND join_token = $2"
        )
        .bind(video_session_id)
        .bind(token)
        .fetch_optional(pool)
        .await?;

        match participant {
            Some(p) => Ok(Some((vs, p))),
            None => Ok(None),
        }
    }

    pub async fn report_recording_result(
        &self,
        pool: &PgPool,
        video_session_id: Uuid,
        recording_url: &str,
        operator_id: Uuid,
    ) -> Result<VideoSessionWithDetails, VideoSessionError> {
        self.get_video_session_by_id(pool, video_session_id).await?
            .ok_or(VideoSessionError::VideoSessionNotFound)?;

        let mut tx = pool.begin().await?;
        let now = Utc::now();

        let _: VideoSession = sqlx::query_as(
            r#"
            UPDATE video_sessions SET recording_url = $1, recording_ready = TRUE, updated_at = $2 WHERE id = $3
            RETURNING id, case_id, room_id, status, scheduled_at, started_at, ended_at, duration_seconds, recording_url, recording_ready, max_participants, created_by, abort_reason, created_at, updated_at
            "#,
        )
        .bind(recording_url)
        .bind(now)
        .bind(video_session_id)
        .fetch_one(&mut *tx)
        .await?;

        let _: VideoSessionEvent = sqlx::query_as(
            r#"
            INSERT INTO video_session_events (video_session_id, event_type, operator_type, operator_id, detail_json, created_at)
            VALUES ($1, 'RECORDING_READY', 'SYSTEM', $2, $3, $4)
            RETURNING id, video_session_id, event_type, operator_type, operator_id, detail_json, created_at
            "#,
        )
        .bind(video_session_id)
        .bind(operator_id)
        .bind(serde_json::json!({"recording_url": recording_url}))
        .bind(now)
        .fetch_one(&mut *tx)
        .await?;

        tx.commit().await?;
        self.get_video_session_detail(pool, video_session_id).await?
            .ok_or(VideoSessionError::VideoSessionNotFound)
    }

    async fn get_video_session_by_id(
        &self,
        pool: &PgPool,
        id: Uuid,
    ) -> Result<Option<VideoSession>, VideoSessionError> {
        let vs: Option<VideoSession> = sqlx::query_as(
            "SELECT id, case_id, room_id, status, scheduled_at, started_at, ended_at, duration_seconds, recording_url, recording_ready, max_participants, created_by, abort_reason, created_at, updated_at FROM video_sessions WHERE id = $1"
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;
        Ok(vs)
    }
}

impl Default for VideoService {
    fn default() -> Self {
        Self::new()
    }
}
