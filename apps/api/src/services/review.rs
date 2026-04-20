use sqlx::PgPool;
use uuid::Uuid;

pub struct ReviewService;

impl ReviewService {
    pub async fn create_review(_pool: &PgPool, _application_id: Uuid, _staff_id: Uuid) -> Result<(), sqlx::Error> {
        todo!()
    }
}
