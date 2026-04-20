use axum::{http::StatusCode, Extension, Json};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

use crate::auth::{verify_token, IdentityType};
use crate::handlers::application::{ApiError, PaginationParams};
use crate::services::case::{self};
use crate::services::case_state::CaseStatus;
use crate::services::certificate;
use crate::services::material;
use crate::services::review;
use crate::services::video;

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
pub struct TimelineItem {
    pub scope: String,
    pub action_type: String,
    pub from_status: Option<String>,
    pub to_status: Option<String>,
    pub comment: Option<String>,
    pub operator_type: String,
    pub created_at: String,
}

impl From<review::ReviewAction> for TimelineItem {
    fn from(a: review::ReviewAction) -> Self {
        let scope = if a.case_id.is_some() {
            "CASE"
        } else {
            "APPLICATION"
        };
        Self {
            scope: scope.to_string(),
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
pub struct CaseResponse {
    pub id: String,
    pub case_no: String,
    pub biz_type: String,
    pub status: String,
    pub accepted_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

impl From<case::Case> for CaseResponse {
    fn from(c: case::Case) -> Self {
        Self {
            id: c.id.to_string(),
            case_no: c.case_no,
            biz_type: c.biz_type,
            status: c.status,
            accepted_at: None,
            created_at: c.created_at.to_rfc3339(),
            updated_at: c.updated_at.to_rfc3339(),
        }
    }
}

#[derive(Debug, Serialize)]
pub struct CaseListItem {
    pub id: String,
    pub case_no: String,
    pub biz_type: String,
    pub status: String,
    pub application_id: String,
    pub assigned_staff_id: Option<String>,
    pub accepted_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

impl From<case::CaseWithAssignedStaff> for CaseListItem {
    fn from(c: case::CaseWithAssignedStaff) -> Self {
        Self {
            id: c.id.to_string(),
            case_no: c.case_no,
            biz_type: c.biz_type,
            status: c.status,
            application_id: c.application_id.to_string(),
            assigned_staff_id: c.assigned_staff_id.map(|id| id.to_string()),
            accepted_at: c.issued_at.map(|t| t.to_rfc3339()),
            created_at: c.created_at.to_rfc3339(),
            updated_at: c.updated_at.to_rfc3339(),
        }
    }
}

#[derive(Debug, Serialize)]
pub struct CaseListResponse {
    pub items: Vec<CaseListItem>,
    pub page: u32,
    pub page_size: u32,
    pub total: i64,
}

#[derive(Debug, Serialize)]
pub struct ApplicationBrief {
    pub id: String,
    pub application_no: String,
    pub biz_type: String,
    pub status: String,
    pub title: String,
    pub submitted_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

impl From<crate::services::application::Application> for ApplicationBrief {
    fn from(a: crate::services::application::Application) -> Self {
        Self {
            id: a.id.to_string(),
            application_no: a.application_no,
            biz_type: a.biz_type,
            status: a.status,
            title: a.title,
            submitted_at: a.submitted_at.map(|t| t.to_rfc3339()),
            created_at: a.created_at.to_rfc3339(),
            updated_at: a.updated_at.to_rfc3339(),
        }
    }
}

#[derive(Debug, Serialize)]
pub struct CertificateBrief {
    pub id: String,
    pub certificate_no: String,
    pub certificate_type: String,
    pub verify_code: String,
    pub digest: String,
    pub status: String,
    pub issued_at: Option<String>,
    pub voided_at: Option<String>,
    pub void_reason: Option<String>,
}

impl From<crate::services::certificate::Certificate> for CertificateBrief {
    fn from(c: crate::services::certificate::Certificate) -> Self {
        Self {
            id: c.id.to_string(),
            certificate_no: c.certificate_no,
            certificate_type: c.certificate_type,
            verify_code: c.verify_code,
            digest: c.digest,
            status: c.status,
            issued_at: c.issued_at.map(|t| t.to_rfc3339()),
            voided_at: c.voided_at.map(|t| t.to_rfc3339()),
            void_reason: c.void_reason,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct VideoSessionBrief {
    pub id: String,
    pub room_id: String,
    pub status: String,
    pub scheduled_at: Option<String>,
    pub started_at: Option<String>,
    pub ended_at: Option<String>,
    pub recording_url: Option<String>,
}

impl From<crate::services::video::VideoSession> for VideoSessionBrief {
    fn from(v: crate::services::video::VideoSession) -> Self {
        Self {
            id: v.id.to_string(),
            room_id: v.room_id,
            status: v.status,
            scheduled_at: v.scheduled_at.map(|t| t.to_rfc3339()),
            started_at: v.started_at.map(|t| t.to_rfc3339()),
            ended_at: v.ended_at.map(|t| t.to_rfc3339()),
            recording_url: v.recording_url,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct CaseDetailResponse {
    pub case: CaseResponse,
    pub application: ApplicationBrief,
    pub materials: Vec<MaterialResponse>,
    pub timeline: Vec<TimelineItem>,
    pub certificate: Option<CertificateBrief>,
    pub latest_video_session: Option<VideoSessionBrief>,
}

#[derive(Debug, Deserialize)]
pub struct AdvanceStatusRequest {
    pub to_status: String,
    pub comment: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct VoidCaseRequest {
    pub comment: Option<String>,
}

pub async fn list_cases(
    headers: axum::http::HeaderMap,
    pool: Extension<PgPool>,
    query: axum::extract::Query<ListCasesQuery>,
) -> Result<Json<CaseListResponse>, (StatusCode, Json<ApiError>)> {
    let _staff_id = extract_staff_id_from_headers(&headers)?;

    let biz_type = query.biz_type.as_deref();
    let status = query.status.as_deref();
    let page = query.pagination.page();
    let page_size = query.pagination.page_size();
    let limit = page_size as i64;
    let offset = query.pagination.offset();

    let (cases, total) = case::list_cases_paginated(&pool, biz_type, status, limit, offset)
        .await
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiError::internal_error()),
            )
        })?;

    let responses: Vec<CaseListItem> = cases.into_iter().map(CaseListItem::from).collect();

    Ok(Json(CaseListResponse {
        items: responses,
        page,
        page_size,
        total,
    }))
}

#[derive(Debug, Deserialize)]
pub struct ListCasesQuery {
    pub biz_type: Option<String>,
    pub status: Option<String>,
    #[serde(flatten)]
    pub pagination: PaginationParams,
}

pub async fn get_case(
    headers: axum::http::HeaderMap,
    pool: Extension<PgPool>,
    path: axum::extract::Path<String>,
) -> Result<Json<CaseDetailResponse>, (StatusCode, Json<ApiError>)> {
    let _staff_id = extract_staff_id_from_headers(&headers)?;

    let case_id = Uuid::parse_str(&path.0)
        .map_err(|_| (StatusCode::BAD_REQUEST, Json(ApiError::bad_request())))?;

    let result = case::get_case_with_details(&pool, case_id)
        .await
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiError::internal_error()),
            )
        })?;

    match result {
        Some((c, app, materials, timeline)) => {
            let cert = certificate::get_certificate_by_case_id(&pool, case_id)
                .await
                .ok()
                .flatten()
                .map(CertificateBrief::from);

            let video_service = video::VideoService::new();
            let latest_video = video_service
                .get_latest_video_session_by_case_id(&pool, case_id)
                .await
                .ok()
                .flatten()
                .map(VideoSessionBrief::from);

            Ok(Json(CaseDetailResponse {
                case: CaseResponse::from(c),
                application: ApplicationBrief::from(app),
                materials: materials.into_iter().map(MaterialResponse::from).collect(),
                timeline: timeline.into_iter().map(TimelineItem::from).collect(),
                certificate: cert,
                latest_video_session: latest_video,
            }))
        }
        None => Err((StatusCode::NOT_FOUND, Json(ApiError::not_found()))),
    }
}

pub async fn advance_status(
    headers: axum::http::HeaderMap,
    pool: Extension<PgPool>,
    path: axum::extract::Path<String>,
    json: Json<AdvanceStatusRequest>,
) -> Result<Json<CaseDetailResponse>, (StatusCode, Json<ApiError>)> {
    let staff_id = extract_staff_id_from_headers(&headers)?;

    let case_id = Uuid::parse_str(&path.0)
        .map_err(|_| (StatusCode::BAD_REQUEST, Json(ApiError::bad_request())))?;

    let to_status = CaseStatus::from_str(&json.to_status).ok_or((
        StatusCode::BAD_REQUEST,
        Json(ApiError::new(400, "invalid to_status")),
    ))?;

    case::advance_case_status(&pool, case_id, to_status, staff_id, json.comment.clone())
        .await
        .map_err(|e| match e {
            case::CaseTransitionError::CaseNotFound => {
                (StatusCode::NOT_FOUND, Json(ApiError::not_found()))
            }
            case::CaseTransitionError::InvalidTransition => (
                StatusCode::BAD_REQUEST,
                Json(ApiError::new(400, "invalid status transition")),
            ),
            case::CaseTransitionError::CaseIsTerminal => (
                StatusCode::BAD_REQUEST,
                Json(ApiError::new(400, "case is in terminal state")),
            ),
            case::CaseTransitionError::DbError(_) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiError::internal_error()),
            ),
        })?;

    let result = case::get_case_with_details(&pool, case_id)
        .await
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiError::internal_error()),
            )
        })?;

    match result {
        Some((c, app, materials, timeline)) => {
            let cert = certificate::get_certificate_by_case_id(&pool, case_id)
                .await
                .ok()
                .flatten()
                .map(CertificateBrief::from);

            let video_service = video::VideoService::new();
            let latest_video = video_service
                .get_latest_video_session_by_case_id(&pool, case_id)
                .await
                .ok()
                .flatten()
                .map(VideoSessionBrief::from);

            Ok(Json(CaseDetailResponse {
                case: CaseResponse::from(c),
                application: ApplicationBrief::from(app),
                materials: materials.into_iter().map(MaterialResponse::from).collect(),
                timeline: timeline.into_iter().map(TimelineItem::from).collect(),
                certificate: cert,
                latest_video_session: latest_video,
            }))
        }
        None => Err((StatusCode::NOT_FOUND, Json(ApiError::not_found()))),
    }
}

pub async fn void_case(
    headers: axum::http::HeaderMap,
    pool: Extension<PgPool>,
    path: axum::extract::Path<String>,
    json: Json<VoidCaseRequest>,
) -> Result<Json<CaseDetailResponse>, (StatusCode, Json<ApiError>)> {
    let staff_id = extract_staff_id_from_headers(&headers)?;

    let case_id = Uuid::parse_str(&path.0)
        .map_err(|_| (StatusCode::BAD_REQUEST, Json(ApiError::bad_request())))?;

    case::void_case(&pool, case_id, staff_id, json.comment.clone())
        .await
        .map_err(|e| match e {
            case::CaseTransitionError::CaseNotFound => {
                (StatusCode::NOT_FOUND, Json(ApiError::not_found()))
            }
            case::CaseTransitionError::InvalidTransition => (
                StatusCode::BAD_REQUEST,
                Json(ApiError::new(400, "invalid transition")),
            ),
            case::CaseTransitionError::CaseIsTerminal => (
                StatusCode::BAD_REQUEST,
                Json(ApiError::new(
                    400,
                    "issued case must be voided through certificate void workflow",
                )),
            ),
            case::CaseTransitionError::DbError(_) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiError::internal_error()),
            ),
        })?;

    let result = case::get_case_with_details(&pool, case_id)
        .await
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiError::internal_error()),
            )
        })?;

    match result {
        Some((c, app, materials, timeline)) => {
            let cert = certificate::get_certificate_by_case_id(&pool, case_id)
                .await
                .ok()
                .flatten()
                .map(CertificateBrief::from);

            let video_service = video::VideoService::new();
            let latest_video = video_service
                .get_latest_video_session_by_case_id(&pool, case_id)
                .await
                .ok()
                .flatten()
                .map(VideoSessionBrief::from);

            Ok(Json(CaseDetailResponse {
                case: CaseResponse::from(c),
                application: ApplicationBrief::from(app),
                materials: materials.into_iter().map(MaterialResponse::from).collect(),
                timeline: timeline.into_iter().map(TimelineItem::from).collect(),
                certificate: cert,
                latest_video_session: latest_video,
            }))
        }
        None => Err((StatusCode::NOT_FOUND, Json(ApiError::not_found()))),
    }
}