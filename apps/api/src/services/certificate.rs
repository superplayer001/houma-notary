use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Certificate {
    pub id: Uuid,
    pub case_id: Uuid,
    pub certificate_no: String,
    pub verify_code: String,
    pub pdf_path: Option<String>,
    pub voided: bool,
    pub void_reason: Option<String>,
    pub voided_at: Option<DateTime<Utc>>,
    pub voided_by: Option<Uuid>,
    pub issued_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
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

pub async fn get_certificate_by_case_id(
    pool: &PgPool,
    case_id: Uuid,
) -> Result<Option<Certificate>, sqlx::Error> {
    let cert = sqlx::query_as::<_, Certificate>(
        r#"
        SELECT id, case_id, certificate_no, verify_code, pdf_path, voided, void_reason, voided_at, voided_by, issued_at, created_at
        FROM certificates WHERE case_id = $1
        "#,
    )
    .bind(case_id)
    .fetch_optional(pool)
    .await?;

    Ok(cert)
}
