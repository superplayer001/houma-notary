use axum::{http::StatusCode, Extension, Json};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

use crate::auth::{verify_token, IdentityType};
use crate::services::application;
use crate::services::material;
use crate::services::review;
use crate::services::workflow;

use super::application::{ApiError, ApplicationDetailResponse, ApplicationTimelineItem};

fn extract_user_id_from_headers(
    headers: &axum::http::HeaderMap,
) -> Result<Uuid, (StatusCode, Json<ApiError>)> {
    let auth_header = headers
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.strip_prefix("Bearer "))
        .ok_or((StatusCode::UNAUTHORIZED, Json(ApiError::unauthorized())))?;

    let claims = verify_token(auth_header)
        .map_err(|_| (StatusCode::UNAUTHORIZED, Json(ApiError::unauthorized())))?;

    if claims.identity_type != IdentityType::User {
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
pub struct ApplicationResponse {
    pub id: String,
    pub application_no: String,
    pub biz_type: String,
    pub status: String,
    pub title: String,
    pub created_at: String,
    pub materials: Vec<MaterialResponse>,
    pub review_actions: Vec<ReviewActionResponse>,
}

impl ApplicationResponse {
    pub async fn from_application(
        app: crate::services::application::Application,
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
            created_at: app.created_at.to_rfc3339(),
            materials: materials.into_iter().map(MaterialResponse::from).collect(),
            review_actions: review_actions
                .into_iter()
                .map(ReviewActionResponse::from)
                .collect(),
        })
    }
}

#[derive(Debug, Deserialize)]
pub struct SubmitSupplementRequest {
    pub comment: Option<String>,
}

pub async fn submit_application(
    headers: axum::http::HeaderMap,
    pool: Extension<PgPool>,
    path: axum::extract::Path<String>,
) -> Result<Json<ApplicationDetailResponse>, (StatusCode, Json<ApiError>)> {
    let user_id = extract_user_id_from_headers(&headers)?;

    let app_id = Uuid::parse_str(&path.0)
        .map_err(|_| (StatusCode::BAD_REQUEST, Json(ApiError::bad_request())))?;

    let result = workflow::submit_application(&pool, app_id, user_id)
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
                Json(ApiError::new(400, "invalid status for submission")),
            ),
            workflow::WorkflowError::NoMaterials => (
                StatusCode::BAD_REQUEST,
                Json(ApiError::new(
                    400,
                    "must upload at least one material before submission",
                )),
            ),
            workflow::WorkflowError::DbError(_) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiError::internal_error()),
            ),
        })?;

    let app_response =
        super::application::ApplicationResponse::from_application_with_materials(result, &pool)
            .await
            .map_err(|_| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ApiError::internal_error()),
                )
            })?;

    let review_actions = review::list_review_actions_by_application(&pool, app_id)
        .await
        .unwrap_or_default();

    let mut timeline: Vec<ApplicationTimelineItem> = review_actions
        .into_iter()
        .map(ApplicationTimelineItem::from)
        .collect();

    let supplement_reason = timeline
        .iter()
        .rev()
        .find(|item| item.action_type == "REQUIRE_SUPPLEMENT")
        .and_then(|item| item.comment.clone());

    Ok(Json(ApplicationDetailResponse {
        application: app_response,
        timeline,
        supplement_reason,
    }))
}

pub async fn submit_supplement(
    headers: axum::http::HeaderMap,
    pool: Extension<PgPool>,
    path: axum::extract::Path<String>,
    json: Json<SubmitSupplementRequest>,
) -> Result<Json<ApplicationDetailResponse>, (StatusCode, Json<ApiError>)> {
    let user_id = extract_user_id_from_headers(&headers)?;

    let app_id = Uuid::parse_str(&path.0)
        .map_err(|_| (StatusCode::BAD_REQUEST, Json(ApiError::bad_request())))?;

    let result = workflow::submit_supplement(&pool, app_id, user_id, json.comment.clone())
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
                Json(ApiError::new(
                    400,
                    "invalid status for supplement submission",
                )),
            ),
            workflow::WorkflowError::NoMaterials => (
                StatusCode::BAD_REQUEST,
                Json(ApiError::new(400, "no materials")),
            ),
            workflow::WorkflowError::DbError(_) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiError::internal_error()),
            ),
        })?;

    let app_response =
        super::application::ApplicationResponse::from_application_with_materials(result, &pool)
            .await
            .map_err(|_| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ApiError::internal_error()),
                )
            })?;

    let review_actions = review::list_review_actions_by_application(&pool, app_id)
        .await
        .unwrap_or_default();

    let mut timeline: Vec<ApplicationTimelineItem> = review_actions
        .into_iter()
        .map(ApplicationTimelineItem::from)
        .collect();

    let supplement_reason = timeline
        .iter()
        .rev()
        .find(|item| item.action_type == "REQUIRE_SUPPLEMENT")
        .and_then(|item| item.comment.clone());

    Ok(Json(ApplicationDetailResponse {
        application: app_response,
        timeline,
        supplement_reason,
    }))
}

#[derive(Debug, Deserialize)]
pub struct WithdrawRequest {
    pub comment: Option<String>,
}

pub async fn withdraw_application(
    headers: axum::http::HeaderMap,
    pool: Extension<PgPool>,
    path: axum::extract::Path<String>,
    json: Json<WithdrawRequest>,
) -> Result<Json<ApplicationDetailResponse>, (StatusCode, Json<ApiError>)> {
    let user_id = extract_user_id_from_headers(&headers)?;

    let app_id = Uuid::parse_str(&path.0)
        .map_err(|_| (StatusCode::BAD_REQUEST, Json(ApiError::bad_request())))?;

    let result = application::withdraw_application(&pool, app_id, user_id, json.comment.clone())
        .await
        .map_err(|e| match e {
            application::WithdrawError::ApplicationNotFound => {
                (StatusCode::NOT_FOUND, Json(ApiError::not_found()))
            }
            application::WithdrawError::Forbidden => {
                (StatusCode::FORBIDDEN, Json(ApiError::forbidden()))
            }
            application::WithdrawError::InvalidStatus => (
                StatusCode::BAD_REQUEST,
                Json(ApiError::new(
                    400,
                    "cannot withdraw application in current status",
                )),
            ),
            application::WithdrawError::DbError(_) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiError::internal_error()),
            ),
        })?;

    let app_response =
        super::application::ApplicationResponse::from_application_with_materials(result, &pool)
            .await
            .map_err(|_| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ApiError::internal_error()),
                )
            })?;

    let review_actions = review::list_review_actions_by_application(&pool, app_id)
        .await
        .unwrap_or_default();

    let mut timeline: Vec<ApplicationTimelineItem> = review_actions
        .into_iter()
        .map(ApplicationTimelineItem::from)
        .collect();

    let supplement_reason = timeline
        .iter()
        .rev()
        .find(|item| item.action_type == "REQUIRE_SUPPLEMENT")
        .and_then(|item| item.comment.clone());

    Ok(Json(ApplicationDetailResponse {
        application: app_response,
        timeline,
        supplement_reason,
    }))
}