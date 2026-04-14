use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct EnforcementRequest {
    pub id: Uuid,
    pub request_no: String,
    pub applicant_name: String,
    pub applicant_id_no: String,
    pub case_description: String,
    pub status: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, thiserror::Error)]
pub enum ExternalError {
    #[error("Request not found")]
    NotFound,
    #[error("Database error: {0}")]
    DbError(#[from] sqlx::Error),
}

pub struct ExternalService;

impl ExternalService {
    pub async fn create_enforcement_application(
        _pool: &PgPool,
        _applicant_name: &str,
        _applicant_id_no: &str,
        _case_description: &str,
    ) -> Result<EnforcementRequest, ExternalError> {
        todo!()
    }

    pub async fn get_enforcement_application(_pool: &PgPool, _request_no: &str) -> Result<Option<EnforcementRequest>, ExternalError> {
        todo!()
    }
}
