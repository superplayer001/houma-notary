// Case Service for PR-07
// Handles case CRUD operations

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

use super::case_state::{CaseBizType, CaseStatus};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Case {
    pub id: Uuid,
    pub case_no: String,
    pub biz_type: String,
    pub status: String,
    pub title: String,
    pub created_by_staff_id: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CreateCaseInput {
    pub biz_type: String,
    pub title: String,
}

pub struct CaseService;

impl CaseService {
    /// Get case by ID
    pub async fn get_case_by_id(pool: &PgPool, id: Uuid) -> Result<Option<Case>, sqlx::Error> {
        let case = sqlx::query_as::<_, Case>(
            r#"
            SELECT id, case_no, biz_type, status, title, created_by_staff_id, created_at, updated_at
            FROM cases WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(case)
    }

    /// List cases with optional filters
    pub async fn list_cases(
        pool: &PgPool,
        biz_type: Option<&str>,
        status: Option<&str>,
    ) -> Result<Vec<Case>, sqlx::Error> {
        let cases = if biz_type.is_some() || status.is_some() {
            sqlx::query_as::<_, Case>(
                r#"
                SELECT id, case_no, biz_type, status, title, created_by_staff_id, created_at, updated_at
                FROM cases
                WHERE ($1::text IS NULL OR biz_type = $1)
                  AND ($2::text IS NULL OR status = $2)
                ORDER BY created_at DESC
                "#,
            )
            .bind(biz_type)
            .bind(status)
            .fetch_all(pool)
            .await?
        } else {
            sqlx::query_as::<_, Case>(
                r#"
                SELECT id, case_no, biz_type, status, title, created_by_staff_id, created_at, updated_at
                FROM cases ORDER BY created_at DESC
                "#,
            )
            .fetch_all(pool)
            .await?
        };

        Ok(cases)
    }

    /// Update case status
    pub async fn update_status(
        pool: &PgPool,
        id: Uuid,
        new_status: &str,
    ) -> Result<Option<Case>, sqlx::Error> {
        let case = sqlx::query_as::<_, Case>(
            r#"
            UPDATE cases SET status = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING id, case_no, biz_type, status, title, created_by_staff_id, created_at, updated_at
            "#,
        )
        .bind(new_status)
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(case)
    }
}
