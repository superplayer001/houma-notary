use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Certificate {
    pub id: Uuid,
    pub case_id: Uuid,
    pub certificate_no: String,
    pub verify_code: String,
    pub issued_at: chrono::DateTime<chrono::Utc>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CertificateDetail {
    pub certificate: Certificate,
    pub case_title: String,
    pub case_description: Option<String>,
}

#[derive(Debug, thiserror::Error)]
pub enum CertificateError {
    #[error("Certificate not found")]
    NotFound,
    #[error("Database error: {0}")]
    DbError(#[from] sqlx::Error),
}

pub struct CertificateService;

impl CertificateService {
    pub async fn issue(_pool: &PgPool, _case_id: Uuid, _staff_id: Uuid) -> Result<Certificate, CertificateError> {
        todo!()
    }

    pub async fn get_detail(_pool: &PgPool, _id: Uuid) -> Result<Option<CertificateDetail>, CertificateError> {
        todo!()
    }

    pub async fn get_by_verify_code(_pool: &PgPool, _code: &str) -> Result<Option<CertificateDetail>, CertificateError> {
        todo!()
    }
}
