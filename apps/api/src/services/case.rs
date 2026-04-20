use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use thiserror::Error;
use uuid::Uuid;

use super::case_state::CaseStatus;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Case {
    pub id: Uuid,
    pub case_no: String,
    pub application_id: Uuid,
    pub biz_type: String,
    pub status: String,
    pub title: String,
    pub created_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct CaseWithAssignedStaff {
    pub id: Uuid,
    pub case_no: String,
    pub application_id: Uuid,
    pub biz_type: String,
    pub status: String,
    pub title: String,
    pub assigned_staff_id: Option<Uuid>,
    pub created_by: Uuid,
    pub issued_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CreateCaseInput {
    pub biz_type: String,
    pub title: String,
}

#[derive(Debug, Error)]
pub enum CaseTransitionError {
    #[error("Case not found")]
    CaseNotFound,
    #[error("Invalid transition")]
    InvalidTransition,
    #[error("Case is in terminal state")]
    CaseIsTerminal,
    #[error("Database error: {0}")]
    DbError(#[from] sqlx::Error),
}

pub struct CaseService;

impl CaseService {
    pub async fn get_case_by_id(pool: &PgPool, id: Uuid) -> Result<Option<Case>, sqlx::Error> {
        let case = sqlx::query_as::<_, Case>(
            r#"
            SELECT id, case_no, biz_type, status, title, created_by, created_at, updated_at
            FROM cases WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(case)
    }

    pub async fn list_cases(
        pool: &PgPool,
        biz_type: Option<&str>,
        status: Option<&str>,
    ) -> Result<Vec<Case>, sqlx::Error> {
        let cases = if biz_type.is_some() || status.is_some() {
            sqlx::query_as::<_, Case>(
                r#"
                SELECT id, case_no, biz_type, status, title, created_by, created_at, updated_at
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
                SELECT id, case_no, biz_type, status, title, created_by, created_at, updated_at
                FROM cases ORDER BY created_at DESC
                "#,
            )
            .fetch_all(pool)
            .await?
        };

        Ok(cases)
    }

    pub async fn update_status(
        pool: &PgPool,
        id: Uuid,
        new_status: &str,
    ) -> Result<Option<Case>, sqlx::Error> {
        let case = sqlx::query_as::<_, Case>(
            r#"
            UPDATE cases SET status = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING id, case_no, biz_type, status, title, created_by, created_at, updated_at
            "#,
        )
        .bind(new_status)
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(case)
    }
}

pub async fn list_cases_paginated(
    pool: &PgPool,
    biz_type: Option<&str>,
    status: Option<&str>,
    limit: i64,
    offset: i64,
) -> Result<(Vec<CaseWithAssignedStaff>, i64), sqlx::Error> {
    let cases = sqlx::query_as::<_, CaseWithAssignedStaff>(
        r#"
        SELECT 
            id, case_no, biz_type, status, title,
            application_id,
            NULL as assigned_staff_id,
            created_by,
            issued_at,
            created_at, updated_at
        FROM cases
        WHERE ($1::text IS NULL OR biz_type = $1)
          AND ($2::text IS NULL OR status = $2)
        ORDER BY created_at DESC
        LIMIT $3 OFFSET $4
        "#,
    )
    .bind(biz_type)
    .bind(status)
    .bind(limit)
    .bind(offset)
    .fetch_all(pool)
    .await?;

    let total: (i64,) = sqlx::query_as(
        r#"
        SELECT COUNT(*) FROM cases
        WHERE ($1::text IS NULL OR biz_type = $1)
          AND ($2::text IS NULL OR status = $2)
        "#,
    )
    .bind(biz_type)
    .bind(status)
    .fetch_one(pool)
    .await?;

    Ok((cases, total.0))
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct ApplicationForCase {
    pub id: Uuid,
    pub application_no: String,
    pub biz_type: String,
    pub status: String,
    pub title: String,
    pub submitted_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct MaterialForCase {
    pub id: Uuid,
    pub material_type: String,
    pub file_name: String,
    pub file_size: i64,
    pub file_hash: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewActionForCase {
    pub scope: String,
    pub action_type: String,
    pub from_status: Option<String>,
    pub to_status: Option<String>,
    pub comment: Option<String>,
    pub operator_type: String,
    pub created_at: DateTime<Utc>,
}

pub async fn get_case_with_details(
    pool: &PgPool,
    case_id: Uuid,
) -> Result<Option<(Case, ApplicationForCase, Vec<MaterialForCase>, Vec<ReviewActionForCase>)>, sqlx::Error> {
    let case_row: Option<Case> = sqlx::query_as(
        r#"
        SELECT id, case_no, biz_type, status, title, created_by, created_at, updated_at
        FROM cases WHERE id = $1
        "#,
    )
    .bind(case_id)
    .fetch_optional(pool)
    .await?;

    let case = match case_row {
        Some(c) => c,
        None => return Ok(None),
    };

    let app: Option<ApplicationForCase> = sqlx::query_as(
        r#"
        SELECT id, application_no, biz_type, status, title, submitted_at, created_at, updated_at
        FROM applications WHERE id = $1
        "#,
    )
    .bind(case.application_id)
    .fetch_optional(pool)
    .await?;

    let app = match app {
        Some(a) => a,
        None => return Ok(None),
    };

    let materials: Vec<MaterialForCase> = sqlx::query_as(
        r#"
        SELECT id, material_type, file_name, file_size, file_hash, created_at
        FROM materials WHERE application_id = $1
        ORDER BY created_at DESC
        "#,
    )
    .bind(case.application_id)
    .fetch_all(pool)
    .await?;

    let reviews_raw: Vec<(String, String, Option<String>, String, Option<String>, String, DateTime<Utc>)> = sqlx::query_as(
        r#"
        SELECT 
            'APPLICATION' as scope,
            action_type::text as action_type,
            from_status,
            to_status::text as to_status,
            comment,
            operator_type::text as operator_type,
            created_at
        FROM review_actions
        WHERE application_id = $1
        ORDER BY created_at DESC
        "#,
    )
    .bind(case.application_id)
    .fetch_all(pool)
    .await?;

    let reviews: Vec<ReviewActionForCase> = reviews_raw
        .into_iter()
        .map(|(scope, action_type, from_status, to_status, comment, operator_type, created_at)| {
            ReviewActionForCase {
                scope,
                action_type,
                from_status,
                to_status: Some(to_status),
                comment,
                operator_type,
                created_at,
            }
        })
        .collect();

    Ok(Some((case, app, materials, reviews)))
}

pub async fn advance_case_status(
    pool: &PgPool,
    case_id: Uuid,
    to_status: CaseStatus,
    staff_id: Uuid,
    comment: Option<String>,
) -> Result<(), CaseTransitionError> {
    let current: Option<(String,)> = sqlx::query_as(
        "SELECT status FROM cases WHERE id = $1",
    )
    .bind(case_id)
    .fetch_optional(pool)
    .await?;

    let current_status = match current {
        Some((s,)) => s,
        None => return Err(CaseTransitionError::CaseNotFound),
    };

    let current = CaseStatus::from_str(&current_status)
        .ok_or(CaseTransitionError::InvalidTransition)?;

    if current.is_terminal() {
        return Err(CaseTransitionError::CaseIsTerminal);
    }

    let to_str = to_status.as_str();

    sqlx::query(
        r#"
        UPDATE cases SET status = $1, updated_at = NOW()
        WHERE id = $2
        "#,
    )
    .bind(to_str)
    .bind(case_id)
    .execute(pool)
    .await?;

    sqlx::query(
        r#"
        INSERT INTO review_actions (application_id, action_type, from_status, to_status, comment, operator_type, operator_id)
        SELECT $1, 'VOID', $2, $3, $4, 'STAFF', $5
        WHERE EXISTS (SELECT 1 FROM cases WHERE id = $1)
        "#,
    )
    .bind(case_id)
    .bind(&current_status)
    .bind(to_str)
    .bind(&comment)
    .bind(staff_id)
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn void_case(
    pool: &PgPool,
    case_id: Uuid,
    staff_id: Uuid,
    reason: Option<String>,
) -> Result<(), CaseTransitionError> {
    let current: Option<(String,)> = sqlx::query_as(
        "SELECT status FROM cases WHERE id = $1",
    )
    .bind(case_id)
    .fetch_optional(pool)
    .await?;

    let current_status = match current {
        Some((s,)) => s,
        None => return Err(CaseTransitionError::CaseNotFound),
    };

    let current = CaseStatus::from_str(&current_status)
        .ok_or(CaseTransitionError::InvalidTransition)?;

    if current == CaseStatus::Issued {
        return Err(CaseTransitionError::InvalidTransition);
    }

    if current.is_terminal() {
        return Err(CaseTransitionError::CaseIsTerminal);
    }

    sqlx::query(
        r#"
        UPDATE cases SET status = 'VOIDED', void_reason = $1, voided_at = NOW(), voided_by = $2, updated_at = NOW()
        WHERE id = $3
        "#,
    )
    .bind(&reason)
    .bind(staff_id)
    .bind(case_id)
    .execute(pool)
    .await?;

    Ok(())
}
