use axum::{http::StatusCode, Extension, Json};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

use crate::auth::{verify_token, IdentityType};
use crate::handlers::application::{ApiError, PaginationParams};
use crate::services::application;
use crate::services::material;
use crate::services::review;
use crate::services::workflow;

fn extract_staff_id_from_headers(
    headers: &axum::http::HeaderMap,
) -> Result<Uuid, (StatusCode, Json<ApiError>)> {
    let auth_header = headers
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.strip_prefix("Bearer "))
        .ok_or((StatusCode::UNAUTHORIZED, Json(ApiError::unauthorized())))?;

    let claims = verify_token(auth_header)
        .map_err(|_| (StatusCode::UNAUTHORIZED, Json(ApiError::unauthorized())))?;

    if claims.identity_type != IdentityType::Staff {
        return Err((StatusCode::FORBIDDEN, Json(ApiError::forbidden())));
    }

    Uuid::parse_str(&claims.sub)
        .map_err(|_| (StatusCode::BAD_REQUEST, Json(ApiError::bad_request())))
}

#[derive(Debug, Serialize)]
pub struct MaterialResponse {
    pub id: String,
    pub material_type: String,
    pub file_name: String,
    pub file_size: i64,
    pub file_hash: String,
    pub created_at: String,
}

impl From<material::Material> for MaterialResponse {
    fn from(m: material::Material) -> Self {
        Self {
            id: m.id.to_string(),
            material_type: m.material_type,
            file_name: m.file_name,
            file_size: m.file_size,
            file_hash: m.file_hash,
            created_at: m.created_at.to_rfc3339(),
        }
    }
}

#[derive(Debug, Serialize)]
pub struct ReviewActionResponse {
    pub action_type: String,
    pub from_status: Option<String>,
    pub to_status: Option<String>,
    pub comment: Option<String>,
    pub operator_type: String,
    pub created_at: String,
}

impl From<review::ReviewAction> for ReviewActionResponse {
    fn from(a: review::ReviewAction) -> Self {
        Self {
            action_type: a.action_type,
            from_status: a.from_status,
            to_status: a.to_status,
            comment: a.comment,
            operator_type: a.operator_type,
            created_at: a.created_at.to_rfc3339(),
        }
    }
}

#[derive(Debug, Serialize)]
pub struct StaffApplicationResponse {
    pub id: String,
    pub application_no: String,
    pub biz_type: String,
    pub status: String,
    pub title: String,
    pub submitted_at: Option<String>,
    pub created_at: String,
    pub materials: Vec<MaterialResponse>,
    pub review_actions: Vec<ReviewActionResponse>,
}

impl StaffApplicationResponse {
    pub async fn from_application(
        app: application::Application,
        pool: &PgPool,
    ) -> Result<Self, sqlx::Error> {
        let materials = material::list_materials_by_application(pool, app.id)
            .await
            .unwrap_or_default();
        let review_actions = review::list_review_actions_by_application(pool, app.id)
            .await
            .unwrap_or_default();

        Ok(Self {
            id: app.id.to_string(),
            application_no: app.application_no,
            biz_type: app.biz_type,
            status: app.status,
            title: app.title,
            submitted_at: app.submitted_at.map(|t| t.to_rfc3339()),
            created_at: app.created_at.to_rfc3339(),
            materials: materials.into_iter().map(MaterialResponse::from).collect(),
            review_actions: review_actions
                .into_iter()
                .map(ReviewActionResponse::from)
                .collect(),
        })
    }
}

#[derive(Debug, Serialize)]
pub struct PendingApplicationResponse {
    pub id: String,
    pub application_no: String,
    pub biz_type: String,
    pub status: String,
    pub title: String,
    pub submitted_at: Option<String>,
    pub created_at: String,
}

impl From<application::Application> for PendingApplicationResponse {
    fn from(app: application::Application) -> Self {
        Self {
            id: app.id.to_string(),
            application_no: app.application_no,
            biz_type: app.biz_type,
            status: app.status,
            title: app.title,
            submitted_at: app.submitted_at.map(|t| t.to_rfc3339()),
            created_at: app.created_at.to_rfc3339(),
        }
    }
}

#[derive(Debug, Serialize)]
pub struct PendingApplicationListResponse {
    pub items: Vec<PendingApplicationResponse>,
    pub page: u32,
    pub page_size: u32,
    pub total: i64,
}

#[derive(Debug, Deserialize)]
pub struct StaffActionRequest {
    pub comment: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct AcceptResponse {
    pub application: AcceptApplicationResponse,
    pub case: AcceptCaseResponse,
}

#[derive(Debug, Serialize)]
pub struct AcceptApplicationResponse {
    pub id: String,
    pub application_no: String,
    pub status: String,
}

#[derive(Debug, Serialize)]
pub struct AcceptCaseResponse {
    pub id: String,
    pub case_no: String,
    pub biz_type: String,
    pub status: String,
    pub accepted_at: String,
}

pub async fn list_pending_applications(
    headers: axum::http::HeaderMap,
    pool: Extension<PgPool>,
    query: axum::extract::Query<PaginationParams>,
) -> Result<Json<PendingApplicationListResponse>, (StatusCode, Json<ApiError>)> {
    let _staff_id = extract_staff_id_from_headers(&headers)?;
    let page = query.page();
    let page_size = query.page_size();
    let limit = page_size as i64;
    let offset = query.offset();

    let (apps, total) = application::list_pending_applications_paginated(&pool, limit, offset)
        .await
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiError::internal_error()),
            )
        })?;

    let responses: Vec<PendingApplicationResponse> = apps
        .into_iter()
        .map(PendingApplicationResponse::from)
        .collect();

    Ok(Json(PendingApplicationListResponse {
        items: responses,
        page,
        page_size,
        total,
    }))
}

pub async fn get_application_for_staff(
    headers: axum::http::HeaderMap,
    pool: Extension<PgPool>,
    path: axum::extract::Path<String>,
) -> Result<Json<StaffApplicationResponse>, (StatusCode, Json<ApiError>)> {
    let _staff_id = extract_staff_id_from_headers(&headers)?;

    let app_id = Uuid::parse_str(&path.0)
        .map_err(|_| (StatusCode::BAD_REQUEST, Json(ApiError::bad_request())))?;

    let app = application::get_application_by_id(&pool, app_id)
        .await
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiError::internal_error()),
            )
        })?;

    match app {
        Some(a) => {
            let response = StaffApplicationResponse::from_application(a, &pool)
                .await
                .map_err(|_| {
                    (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(ApiError::internal_error()),
                    )
                })?;
            Ok(Json(response))
        }
        None => Err((StatusCode::NOT_FOUND, Json(ApiError::not_found()))),
    }
}

pub async fn require_supplement(
    headers: axum::http::HeaderMap,
    pool: Extension<PgPool>,
    path: axum::extract::Path<String>,
    json: Json<StaffActionRequest>,
) -> Result<Json<StaffApplicationResponse>, (StatusCode, Json<ApiError>)> {
    let staff_id = extract_staff_id_from_headers(&headers)?;

    let app_id = Uuid::parse_str(&path.0)
        .map_err(|_| (StatusCode::BAD_REQUEST, Json(ApiError::bad_request())))?;

    let result = workflow::require_supplement(&pool, app_id, staff_id, json.comment.clone())
        .await
        .map_err(|e| match e {
            workflow::WorkflowError::NotFound => {
                (StatusCode::NOT_FOUND, Json(ApiError::not_found()))
            }
            workflow::WorkflowError::Forbidden => {
                (StatusCode::FORBIDDEN, Json(ApiError::forbidden()))
            }
            workflow::WorkflowError::InvalidStatus => (
                StatusCode::BAD_REQUEST,
                Json(ApiError::new(400, "invalid status for this action")),
            ),
            workflow::WorkflowError::NoMaterials => {
                (StatusCode::BAD_REQUEST, Json(ApiError::new(400, "no materials")))
            }
            workflow::WorkflowError::DbError(_) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiError::internal_error()),
            ),
        })?;

    let response = StaffApplicationResponse::from_application(result, &pool)
        .await
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiError::internal_error()),
            )
        })?;

    Ok(Json(response))
}

pub async fn reject_application(
    headers: axum::http::HeaderMap,
    pool: Extension<PgPool>,
    path: axum::extract::Path<String>,
    json: Json<StaffActionRequest>,
) -> Result<Json<StaffApplicationResponse>, (StatusCode, Json<ApiError>)> {
    let staff_id = extract_staff_id_from_headers(&headers)?;

    let app_id = Uuid::parse_str(&path.0)
        .map_err(|_| (StatusCode::BAD_REQUEST, Json(ApiError::bad_request())))?;

    let result = workflow::reject_application(&pool, app_id, staff_id, json.comment.clone())
        .await
        .map_err(|e| match e {
            workflow::WorkflowError::NotFound => {
                (StatusCode::NOT_FOUND, Json(ApiError::not_found()))
            }
            workflow::WorkflowError::Forbidden => {
                (StatusCode::FORBIDDEN, Json(ApiError::forbidden()))
            }
            workflow::WorkflowError::InvalidStatus => (
                StatusCode::BAD_REQUEST,
                Json(ApiError::new(400, "invalid status for this action")),
            ),
            workflow::WorkflowError::NoMaterials => {
                (StatusCode::BAD_REQUEST, Json(ApiError::new(400, "no materials")))
            }
            workflow::WorkflowError::DbError(_) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiError::internal_error()),
            ),
        })?;

    let response = StaffApplicationResponse::from_application(result, &pool)
        .await
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiError::internal_error()),
            )
        })?;

    Ok(Json(response))
}

pub async fn accept_application(
    headers: axum::http::HeaderMap,
    pool: Extension<PgPool>,
    path: axum::extract::Path<String>,
    json: Json<StaffActionRequest>,
) -> Result<Json<AcceptResponse>, (StatusCode, Json<ApiError>)> {
    let staff_id = extract_staff_id_from_headers(&headers)?;

    let app_id = Uuid::parse_str(&path.0)
        .map_err(|_| (StatusCode::BAD_REQUEST, Json(ApiError::bad_request())))?;

    let result = workflow::accept_application(&pool, app_id, staff_id, json.comment.clone())
        .await
        .map_err(|e| match e {
            workflow::WorkflowError::NotFound => {
                (StatusCode::NOT_FOUND, Json(ApiError::not_found()))
            }
            workflow::WorkflowError::Forbidden => {
                (StatusCode::FORBIDDEN, Json(ApiError::forbidden()))
            }
            workflow::WorkflowError::InvalidStatus => (
                StatusCode::BAD_REQUEST,
                Json(ApiError::new(400, "invalid status for this action")),
            ),
            workflow::WorkflowError::NoMaterials => {
                (StatusCode::BAD_REQUEST, Json(ApiError::new(400, "no materials")))
            }
            workflow::WorkflowError::DbError(_) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiError::internal_error()),
            ),
        })?;

    Ok(Json(AcceptResponse {
        application: AcceptApplicationResponse {
            id: result.application.id.to_string(),
            application_no: result.application.application_no,
            status: result.application.status,
        },
        case: AcceptCaseResponse {
            id: result.case.id.to_string(),
            case_no: result.case.case_no,
            biz_type: result.case.biz_type,
            status: result.case.status,
            accepted_at: result.case.accepted_at.unwrap().to_rfc3339(),
        },
    }))
}