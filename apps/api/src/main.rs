mod auth;
mod db;
mod handlers;
mod services;
mod storage;

use axum::{
    extract::State,
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use serde::Serialize;
use std::net::SocketAddr;
use tracing::{info, Level};
use tracing_subscriber::FmtSubscriber;

pub use db::DbPool;
pub use db::AppState;
pub use storage::local::LocalStorage;
pub use storage::Storage;

#[derive(Serialize)]
struct HealthResponse {
    status: &'static str,
}

#[derive(Serialize)]
struct DbHealthResponse {
    status: &'static str,
}

#[derive(Serialize)]
struct DbHealthErrorResponse {
    status: &'static str,
    error: String,
}

async fn health() -> Json<HealthResponse> {
    Json(HealthResponse { status: "ok" })
}

async fn db_health(
    State(state): State<AppState>,
) -> Result<Json<DbHealthResponse>, (StatusCode, Json<DbHealthErrorResponse>)> {
    db::check_connection(&state.pool).await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(DbHealthErrorResponse {
                status: "error",
                error: e.to_string(),
            }),
        )
    })?;
    Ok(Json(DbHealthResponse { status: "ok" }))
}

async fn ping() -> Json<PingResponse> {
    Json(PingResponse { message: "pong" })
}

#[derive(Serialize)]
struct PingResponse {
    message: &'static str,
}

async fn seed_admin_staff(pool: &DbPool) -> Result<(), sqlx::Error> {
    let exists: Option<(String,)> =
        sqlx::query_as("SELECT username FROM staff WHERE username = 'admin'")
            .fetch_optional(pool)
            .await?;

    if exists.is_none() {
        sqlx::query(
            r#"
            INSERT INTO staff (username, display_name, role, status)
            VALUES ('admin', '系统管理员', 'ADMIN', 'ACTIVE')
            "#,
        )
        .execute(pool)
        .await?;
        info!("Default admin staff created");
    }

    Ok(())
}

#[tokio::main]
async fn main() {
    let subscriber = FmtSubscriber::builder()
        .with_max_level(Level::INFO)
        .finish();
    tracing::subscriber::set_global_default(subscriber).expect("setting default subscriber failed");

    auth::jwt::init_jwt_secret();

    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    let pool = db::create_pool(&database_url)
        .await
        .expect("failed to create database pool");

    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("failed to run migrations");

    info!("Database migrations completed");

    seed_admin_staff(&pool)
        .await
        .expect("failed to seed admin staff");

    let storage = LocalStorage::from_env();
    info!("Storage base path: {:?}", storage.base_path());

    let state = AppState { pool, storage };

    let port: u16 = std::env::var("PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse()
        .expect("PORT must be a valid number");

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    info!("Starting server on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app(state)).await.unwrap();
}

fn app(state: AppState) -> Router {
    Router::new()
        .route("/health", get(health))
        .route("/health/db", get(db_health))
        .route("/api/v1/ping", get(ping))
        .route("/api/v1/user/auth/login", post(handlers::user_login))
        .route("/api/v1/staff/auth/login", post(handlers::staff_login))
        .route("/api/v1/user/me", get(handlers::user_me))
        .route("/api/v1/staff/me", get(handlers::staff_me))
        .route("/api/v1/applications", post(handlers::create_application))
        .route("/api/v1/applications", get(handlers::list_applications))
        .route("/api/v1/applications/:id", get(handlers::get_application))
        .route(
            "/api/v1/applications/:id/materials",
            post(handlers::upload_material),
        )
        .route(
            "/api/v1/applications/:id/submit",
            post(handlers::submit_application),
        )
        .route(
            "/api/v1/applications/:id/supplement",
            post(handlers::submit_supplement),
        )
        .route(
            "/api/v1/staff/applications/pending",
            get(handlers::list_pending_applications),
        )
        .route(
            "/api/v1/staff/applications/:id",
            get(handlers::get_application_for_staff),
        )
        .route(
            "/api/v1/staff/applications/:id/require-supplement",
            post(handlers::require_supplement),
        )
        .route(
            "/api/v1/staff/applications/:id/reject",
            post(handlers::reject_application),
        )
        .route(
            "/api/v1/staff/applications/:id/accept",
            post(handlers::accept_application),
        )
        .route("/api/v1/staff/cases", get(handlers::list_cases))
        .route("/api/v1/staff/cases/:id", get(handlers::get_case))
        .route(
            "/api/v1/staff/cases/:id/advance-status",
            post(handlers::advance_status),
        )
        .route("/api/v1/staff/cases/:id/void", post(handlers::void_case))
        .route(
            "/api/v1/staff/cases/:id/issue",
            post(handlers::issue_certificate),
        )
        .route(
            "/api/v1/staff/certificates/:id",
            get(handlers::get_certificate_detail),
        )
        .route(
            "/api/v1/verify/:verify_code",
            get(handlers::get_certificate_by_verify_code),
        )
        .route(
            "/api/v1/external/enforcement/applications",
            post(handlers::create_enforcement_application),
        )
        .route(
            "/api/v1/external/enforcement/applications/:request_no",
            get(handlers::get_enforcement_application),
        )
        .route(
            "/api/v1/staff/video-sessions/:case_id",
            post(handlers::video::create_video_session),
        )
        .route(
            "/api/v1/staff/video-sessions/:id",
            get(handlers::video::get_video_session),
        )
        .route(
            "/api/v1/staff/video-sessions/:id/start",
            post(handlers::video::start_video_session),
        )
        .route(
            "/api/v1/staff/video-sessions/:id/complete",
            post(handlers::video::complete_video_session),
        )
        .route(
            "/api/v1/staff/video-sessions/:id/abort",
            post(handlers::video::abort_video_session),
        )
        .route(
            "/api/v1/video-sessions/:id/join-info",
            get(handlers::video::get_join_info),
        )
        .route(
            "/api/v1/internal/video-sessions/:id/recording-result",
            post(handlers::video::report_recording_result),
        )
        .with_state(state)
}
