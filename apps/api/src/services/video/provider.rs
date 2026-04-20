// Video Provider Abstraction for PR-11
// 只做 mock provider，不接任何真实云厂商 RTC / 云录制能力

use async_trait::async_trait;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

pub type VideoResult<T> = Result<T, VideoProviderError>;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoProviderError {
    pub code: String,
    pub message: String,
}

impl std::fmt::Display for VideoProviderError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "[{}] {}", self.code, self.message)
    }
}

impl std::error::Error for VideoProviderError {}

impl VideoProviderError {
    pub fn new(code: impl Into<String>, message: impl Into<String>) -> Self {
        Self { code: code.into(), message: message.into() }
    }
    pub fn not_found(msg: impl Into<String>) -> Self { Self::new("NOT_FOUND", msg) }
    pub fn invalid_operation(msg: impl Into<String>) -> Self { Self::new("INVALID_OPERATION", msg) }
    pub fn provider_error(msg: impl Into<String>) -> Self { Self::new("PROVIDER_ERROR", msg) }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoomInfo {
    pub room_id: String,
    pub name: String,
    pub created_at: DateTime<Utc>,
}

/// Token for participant to join a room
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParticipantToken {
    pub token: String,
    pub expired_at: DateTime<Utc>,
}

/// Result when stopping recording
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecordingStopResult {
    pub recording_url: String,
    pub recording_hash: String,
}

#[async_trait]
pub trait VideoProvider: Send + Sync {
    /// Create a new video room for a case
    async fn create_room(&self, case_id: Uuid) -> VideoResult<RoomInfo>;
    
    /// Start recording in a room
    async fn start_recording(&self, session_id: Uuid, room_id: &str) -> VideoResult<()>;
    
    /// Stop recording and get result
    async fn stop_recording(&self, session_id: Uuid, room_id: &str) -> VideoResult<RecordingStopResult>;
    
    /// Issue a token for a participant to join
    async fn issue_participant_token(&self, session_id: Uuid, participant_type: &str, participant_id: &str) -> VideoResult<ParticipantToken>;
    
    /// Close/delete a room
    async fn close_room(&self, session_id: Uuid, room_id: &str) -> VideoResult<()>;
}

pub struct MockVideoProvider;

impl MockVideoProvider {
    pub fn new() -> Self { Self }
}

impl Default for MockVideoProvider {
    fn default() -> Self { Self::new() }
}

#[async_trait]
impl VideoProvider for MockVideoProvider {
    async fn create_room(&self, case_id: Uuid) -> VideoResult<RoomInfo> {
        let room_id = format!("room_{}", case_id);
        Ok(RoomInfo {
            room_id,
            name: format!("Video Session for case {}", case_id),
            created_at: Utc::now(),
        })
    }
    
    async fn start_recording(&self, _session_id: Uuid, room_id: &str) -> VideoResult<()> {
        tracing::info!("[Mock] Started recording for room: {}", room_id);
        Ok(())
    }
    
    async fn stop_recording(&self, _session_id: Uuid, room_id: &str) -> VideoResult<RecordingStopResult> {
        tracing::info!("[Mock] Stopped recording for room: {}", room_id);
        let recording_id = uuid::Uuid::new_v4();
        Ok(RecordingStopResult {
            recording_url: format!("https://mock-storage.example.com/recordings/{}.mp4", recording_id),
            recording_hash: format!("sha256:{:x}", fastrand::u64(..)),
        })
    }
    
    async fn issue_participant_token(&self, session_id: Uuid, participant_type: &str, participant_id: &str) -> VideoResult<ParticipantToken> {
        let token = format!("mock_token_{}_{}_{}", session_id, participant_type, participant_id);
        Ok(ParticipantToken {
            token,
            expired_at: Utc::now() + chrono::Duration::hours(2),
        })
    }
    
    async fn close_room(&self, _session_id: Uuid, room_id: &str) -> VideoResult<()> {
        tracing::info!("[Mock] Closed room: {}", room_id);
        Ok(())
    }
}
