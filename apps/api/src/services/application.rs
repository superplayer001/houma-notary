use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Application {
    pub id: Uuid,
    pub user_id: Uuid,
    pub case_id: Option<Uuid>,
    pub status: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ApplicationWithUser {
    pub id: Uuid,
    pub user_id: Uuid,
    pub user_display_name: Option<String>,
    pub case_id: Option<Uuid>,
    pub status: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, thiserror::Error)]
pub enum ApplicationError {
    #[error("Application not found")]
    NotFound,
    #[error("Invalid status transition")]
    InvalidStatusTransition,
    #[error("Database error: {0}")]
    DbError(#[from] sqlx::Error),
}

pub struct ApplicationService;

impl ApplicationService {
    pub async fn create(_pool: &PgPool, _user_id: Uuid) -> Result<Application, ApplicationError> {
        todo!()
    }

    pub async fn list_by_user(_pool: &PgPool, _user_id: Uuid) -> Result<Vec<Application>, ApplicationError> {
        todo!()
    }

    pub async fn list_pending(_pool: &PgPool) -> Result<Vec<ApplicationWithUser>, ApplicationError> {
        todo!()
    }

    pub async fn get_for_staff(_pool: &PgPool, _id: Uuid) -> Result<Option<ApplicationWithUser>, ApplicationError> {
        todo!()
    }

    pub async fn require_supplement(_pool: &PgPool, _id: Uuid, _reason: &str) -> Result<(), ApplicationError> {
        todo!()
    }

    pub async fn reject(_pool: &PgPool, _id: Uuid, _reason: &str) -> Result<(), ApplicationError> {
        todo!()
    }

    pub async fn accept(_pool: &PgPool, _id: Uuid, _staff_id: Uuid) -> Result<Uuid, ApplicationError> {
        todo!()
    }

    pub async fn submit(_pool: &PgPool, _id: Uuid) -> Result<(), ApplicationError> {
        todo!()
    }

    pub async fn submit_supplement(_pool: &PgPool, _id: Uuid) -> Result<(), ApplicationError> {
        todo!()
    }
}
