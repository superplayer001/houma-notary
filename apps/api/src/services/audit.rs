// Audit Service
// Logs all significant actions for traceability

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use sqlx::PgPool;
use uuid::Uuid;

/// Entity types for audit logging
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum EntityType {
    User,
    Staff,
    Application,
    Case,
    Material,
    ReviewAction,
    AuditLog,
    VideoSession,  // PR-11: Added for video session auditing
    Certificate,
    NumberSequence,
    ExternalRequest,
}

impl EntityType {
    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "USER" => Some(Self::User),
            "STAFF" => Some(Self::Staff),
            "APPLICATION" => Some(Self::Application),
            "CASE" => Some(Self::Case),
            "MATERIAL" => Some(Self::Material),
            "REVIEW_ACTION" => Some(Self::ReviewAction),
            "AUDIT_LOG" => Some(Self::AuditLog),
            "VIDEO_SESSION" => Some(Self::VideoSession),
            "CERTIFICATE" => Some(Self::Certificate),
            "NUMBER_SEQUENCE" => Some(Self::NumberSequence),
            "EXTERNAL_REQUEST" => Some(Self::ExternalRequest),
            _ => None,
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            Self::User => "USER",
            Self::Staff => "STAFF",
            Self::Application => "APPLICATION",
            Self::Case => "CASE",
            Self::Material => "MATERIAL",
            Self::ReviewAction => "REVIEW_ACTION",
            Self::AuditLog => "AUDIT_LOG",
            Self::VideoSession => "VIDEO_SESSION",
            Self::Certificate => "CERTIFICATE",
            Self::NumberSequence => "NUMBER_SEQUENCE",
            Self::ExternalRequest => "EXTERNAL_REQUEST",
        }
    }
}

/// Operator type for audit
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum OperatorType {
    User,
    Staff,
    System,
}

impl OperatorType {
    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "USER" => Some(Self::User),
            "STAFF" => Some(Self::Staff),
            "SYSTEM" => Some(Self::System),
            _ => None,
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            Self::User => "USER",
            Self::Staff => "STAFF",
            Self::System => "SYSTEM",
        }
    }
}

/// Audit log entry
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct AuditLog {
    pub id: Uuid,
    pub entity_type: String,
    pub entity_id: Uuid,
    pub action: String,
    pub operator_type: String,
    pub operator_id: Option<Uuid>,
    pub detail: Option<JsonValue>,
    pub created_at: DateTime<Utc>,
}

/// Input for creating audit log
pub struct CreateAuditLogInput {
    pub entity_type: EntityType,
    pub entity_id: Uuid,
    pub action: String,
    pub operator_type: OperatorType,
    pub operator_id: Option<Uuid>,
    pub detail: Option<JsonValue>,
}

impl AuditLog {
    pub fn new(
        operator_id: Uuid,
        entity_type: EntityType,
        entity_id: Uuid,
        action: impl Into<String>,
        detail: Option<JsonValue>,
    ) -> Self {
        Self {
            id: Uuid::new_v4(),
            entity_type: entity_type.as_str().to_string(),
            entity_id,
            action: action.into(),
            operator_type: OperatorType::Staff.as_str().to_string(),
            operator_id: Some(operator_id),
            detail,
            created_at: Utc::now(),
        }
    }

    pub async fn insert(
        &self,
        tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO audit_logs (id, entity_type, entity_id, action, operator_type, operator_id, detail, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#,
        )
        .bind(self.id)
        .bind(&self.entity_type)
        .bind(self.entity_id)
        .bind(&self.action)
        .bind(&self.operator_type)
        .bind(self.operator_id)
        .bind(&self.detail)
        .bind(self.created_at)
        .execute(&mut **tx)
        .await?;

        Ok(())
    }
}

/// Create audit log helper
pub async fn create_audit_log(
    pool: &PgPool,
    input: CreateAuditLogInput,
) -> Result<AuditLog, sqlx::Error> {
    let log = AuditLog {
        id: Uuid::new_v4(),
        entity_type: input.entity_type.as_str().to_string(),
        entity_id: input.entity_id,
        action: input.action,
        operator_type: input.operator_type.as_str().to_string(),
        operator_id: input.operator_id,
        detail: input.detail,
        created_at: Utc::now(),
    };

    sqlx::query(
        r#"
        INSERT INTO audit_logs (id, entity_type, entity_id, action, operator_type, operator_id, detail, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        "#,
    )
    .bind(log.id)
    .bind(&log.entity_type)
    .bind(log.entity_id)
    .bind(&log.action)
    .bind(&log.operator_type)
    .bind(log.operator_id)
    .bind(&log.detail)
    .bind(log.created_at)
    .execute(pool)
    .await?;

    Ok(log)
}
