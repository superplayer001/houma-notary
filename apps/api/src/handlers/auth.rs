use axum::{
    extract::State,
    http::{HeaderMap, StatusCode},
    Json,
};
use serde::{Deserialize, Serialize};

use crate::auth::jwt::{generate_token, hash_password, verify_password, verify_token, IdentityType};
use crate::db::AppState;

const TOKEN_EXPIRY_SECS: i64 = 24 * 3600;

#[derive(Debug, Deserialize)]
pub struct UserRegisterRequest {
    pub username: String,
    pub phone: String,
    pub password: String,
    pub real_name: String,
    pub id_card_no: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UserLoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct StaffLoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub user_id: String,
    pub user_type: String,
    pub username: String,
}

impl LoginResponse {
    fn new(token: String, id: uuid::Uuid, identity_type: IdentityType, username: String) -> Self {
        let user_type = match identity_type {
            IdentityType::User => "user",
            IdentityType::Staff => "staff",
        };
        Self {
            token,
            user_id: id.to_string(),
            user_type: user_type.to_string(),
            username,
        }
    }
}

pub async fn user_register(
    State(state): State<AppState>,
    Json(req): Json<UserRegisterRequest>,
) -> Result<Json<LoginResponse>, StatusCode> {
    if !req.phone.starts_with("1") || req.phone.len() != 11 {
        return Err(StatusCode::BAD_REQUEST);
    }
    if req.password.len() < 6 {
        return Err(StatusCode::BAD_REQUEST);
    }

    let existing = sqlx::query_as::<_, (uuid::Uuid,)>(
        "SELECT id FROM users WHERE username = $1 OR phone = $2",
    )
    .bind(&req.username)
    .bind(&req.phone)
    .fetch_optional(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if existing.is_some() {
        return Err(StatusCode::CONFLICT);
    }

    let password_hash = hash_password(&req.password);
    let user = sqlx::query_as::<_, (uuid::Uuid, String)>(
        r#"
        INSERT INTO users (username, phone, password_hash, display_name, id_card_no, status)
        VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
        RETURNING id, username
        "#,
    )
    .bind(&req.username)
    .bind(&req.phone)
    .bind(&password_hash)
    .bind(&req.real_name)
    .bind(&req.id_card_no)
    .fetch_one(&state.pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to create user: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let (id, username) = user;
    let token = generate_token(id, IdentityType::User, &username, TOKEN_EXPIRY_SECS)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(LoginResponse::new(token, id, IdentityType::User, username)))
}

pub async fn user_login(
    State(state): State<AppState>,
    Json(req): Json<UserLoginRequest>,
) -> Result<Json<LoginResponse>, StatusCode> {
    let user = sqlx::query_as::<_, (uuid::Uuid, String, String)>(
        "SELECT id, username, password_hash FROM users WHERE username = $1 AND status = 'ACTIVE'",
    )
    .bind(&req.username)
    .fetch_optional(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let (id, username, password_hash) = user
        .ok_or(StatusCode::UNAUTHORIZED)?;

    if !verify_password(&req.password, &password_hash) {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let token = generate_token(id, IdentityType::User, &username, TOKEN_EXPIRY_SECS)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(LoginResponse::new(token, id, IdentityType::User, username)))
}

pub async fn staff_login(
    State(state): State<AppState>,
    Json(req): Json<StaffLoginRequest>,
) -> Result<Json<LoginResponse>, StatusCode> {
    let staff = sqlx::query_as::<_, (uuid::Uuid, String, String)>(
        "SELECT id, username, password_hash FROM staff WHERE username = $1 AND status = 'ACTIVE'",
    )
    .bind(&req.username)
    .fetch_optional(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let (id, username, password_hash) = staff
        .ok_or(StatusCode::UNAUTHORIZED)?;

    if !verify_password(&req.password, &password_hash) {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let token = generate_token(id, IdentityType::Staff, &username, TOKEN_EXPIRY_SECS)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(LoginResponse::new(token, id, IdentityType::Staff, username)))
}

#[derive(Debug, Serialize)]
pub struct UserMeResponse {
    pub id: String,
    pub username: String,
    pub display_name: String,
}

#[derive(Debug, Serialize)]
pub struct StaffMeResponse {
    pub id: String,
    pub username: String,
    pub display_name: String,
    pub role: String,
}

fn extract_token_from_headers(headers: &HeaderMap) -> Result<String, StatusCode> {
    headers
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.strip_prefix("Bearer "))
        .map(|s| s.to_string())
        .ok_or(StatusCode::UNAUTHORIZED)
}

pub async fn user_me(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<UserMeResponse>, StatusCode> {
    let token = extract_token_from_headers(&headers)?;

    let claims = verify_token(&token)
        .map_err(|_| StatusCode::UNAUTHORIZED)?;

    if claims.identity_type != IdentityType::User {
        return Err(StatusCode::FORBIDDEN);
    }

    let user = sqlx::query_as::<_, (String, String, String)>(
        "SELECT id::text, username, display_name FROM users WHERE id = $1 AND status = 'ACTIVE'",
    )
    .bind(&claims.sub)
    .fetch_optional(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let (id, username, display_name) = user.ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(UserMeResponse {
        id,
        username,
        display_name,
    }))
}

pub async fn staff_me(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<StaffMeResponse>, StatusCode> {
    let token = extract_token_from_headers(&headers)?;

    let claims = verify_token(&token)
        .map_err(|_| StatusCode::UNAUTHORIZED)?;

    if claims.identity_type != IdentityType::Staff {
        return Err(StatusCode::FORBIDDEN);
    }

    let staff = sqlx::query_as::<_, (String, String, String, String)>(
        r#"SELECT id::text, username, display_name, role::text FROM staff WHERE id = $1 AND status = 'ACTIVE'"#,
    )
    .bind(&claims.sub)
    .fetch_optional(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let (id, username, display_name, role) = staff.ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(StaffMeResponse {
        id,
        username,
        display_name,
        role,
    }))
}
