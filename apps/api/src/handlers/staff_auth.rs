use axum::{http::StatusCode, Extension, Json};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

use crate::auth::{sign_token, verify_token, IdentityType};

#[derive(Debug, Deserialize)]
pub struct StaffLoginRequest {
    pub username: String,
}

#[derive(Debug, Serialize)]
pub struct StaffLoginResponse {
    pub token: String,
    pub staff: StaffInfo,
}

#[derive(Debug, Serialize)]
pub struct StaffInfo {
    pub id: String,
    pub username: String,
    pub display_name: String,
    pub role: String,
}

#[derive(Debug, serde::Serialize)]
pub struct AuthJsonError {
    pub error: String,
}

impl AuthJsonError {
    pub fn unauthorized() -> Self {
        Self {
            error: "unauthorized".to_string(),
        }
    }

    pub fn forbidden() -> Self {
        Self {
            error: "forbidden".to_string(),
        }
    }
}

pub async fn staff_login(
    pool: Extension<PgPool>,
    json: Json<StaffLoginRequest>,
) -> Result<Json<StaffLoginResponse>, (StatusCode, Json<AuthJsonError>)> {
    let staff: Option<Staff> = sqlx::query_as(
        "SELECT id, username, display_name, role, status, created_at FROM staff WHERE username = $1",
    )
    .bind(&json.username)
    .fetch_optional(&*pool)
    .await
    .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, Json(AuthJsonError::unauthorized())))?;

    match staff {
        Some(s) => {
            let token = sign_token(&s.id.to_string(), IdentityType::Staff, 24).map_err(|_| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(AuthJsonError::unauthorized()),
                )
            })?;

            Ok(Json(StaffLoginResponse {
                token,
                staff: StaffInfo {
                    id: s.id.to_string(),
                    username: s.username,
                    display_name: s.display_name,
                    role: s.role,
                },
            }))
        }
        None => Err((StatusCode::NOT_FOUND, Json(AuthJsonError::unauthorized()))),
    }
}

#[derive(Debug, sqlx::FromRow)]
pub struct Staff {
    pub id: uuid::Uuid,
    pub username: String,
    pub display_name: String,
    pub role: String,
    pub status: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

pub async fn staff_me(
    headers: axum::http::HeaderMap,
    pool: Extension<PgPool>,
) -> Result<Json<StaffMeResponse>, (StatusCode, Json<AuthJsonError>)> {
    let auth_header = headers
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.strip_prefix("Bearer "))
        .ok_or((
            StatusCode::UNAUTHORIZED,
            Json(AuthJsonError::unauthorized()),
        ))?;

    let claims = verify_token(auth_header).map_err(|_| {
        (
            StatusCode::UNAUTHORIZED,
            Json(AuthJsonError::unauthorized()),
        )
    })?;

    if claims.identity_type != IdentityType::Staff {
        return Err((StatusCode::FORBIDDEN, Json(AuthJsonError::forbidden())));
    }

    let staff_id_parsed = uuid::Uuid::parse_str(&claims.sub)
        .map_err(|_| (StatusCode::BAD_REQUEST, Json(AuthJsonError::unauthorized())))?;

    let staff: Option<Staff> = sqlx::query_as(
        "SELECT id, username, display_name, role, status, created_at FROM staff WHERE id = $1",
    )
    .bind(staff_id_parsed)
    .fetch_optional(&*pool)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(AuthJsonError::unauthorized()),
        )
    })?;

    match staff {
        Some(s) => Ok(Json(StaffMeResponse {
            id: s.id.to_string(),
            username: s.username,
            display_name: s.display_name,
            role: s.role,
            status: s.status,
        })),
        None => Err((StatusCode::NOT_FOUND, Json(AuthJsonError::unauthorized()))),
    }
}

#[derive(Debug, Serialize)]
pub struct StaffMeResponse {
    pub id: String,
    pub username: String,
    pub display_name: String,
    pub role: String,
    pub status: String,
}