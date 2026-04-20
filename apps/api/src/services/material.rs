use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Material {
    pub id: Uuid,
    pub application_id: Uuid,
    pub name: String,
    pub file_path: String,
    pub file_size: i64,
    pub mime_type: String,
    pub uploaded_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, thiserror::Error)]
pub enum MaterialError {
    #[error("Material not found")]
    NotFound,
    #[error("Database error: {0}")]
    DbError(#[from] sqlx::Error),
}

pub struct MaterialService;

impl MaterialService {
    pub async fn upload(
        _pool: &PgPool,
        _application_id: Uuid,
        _name: &str,
        _file_path: &str,
        _file_size: i64,
        _mime_type: &str,
    ) -> Result<Material, MaterialError> {
        todo!()
    }

    pub async fn list_by_application(_pool: &PgPool, _application_id: Uuid) -> Result<Vec<Material>, MaterialError> {
        todo!()
    }
}
