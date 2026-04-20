use sqlx::PgPool;

pub struct NumberingService;

impl NumberingService {
    pub async fn generate_case_no(_pool: &PgPool) -> Result<String, sqlx::Error> {
        todo!()
    }

    pub async fn generate_certificate_no(_pool: &PgPool) -> Result<String, sqlx::Error> {
        todo!()
    }

    pub async fn generate_verify_code(_pool: &PgPool) -> Result<String, sqlx::Error> {
        todo!()
    }
}
