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
