use sqlx::PgPool;
use uuid::Uuid;

pub struct WorkflowService;

impl WorkflowService {
    pub async fn advance_case_status(_pool: &PgPool, _case_id: Uuid, _staff_id: Uuid) -> Result<(), sqlx::Error> {
        todo!()
    }

    pub async fn void_case(_pool: &PgPool, _case_id: Uuid, _staff_id: Uuid, _reason: &str) -> Result<(), sqlx::Error> {
        todo!()
    }
}
