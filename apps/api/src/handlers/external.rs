use axum::{http::StatusCode, Json};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct CreateEnforcementApplicationRequest {
    pub applicant_name: String,
    pub applicant_id_no: String,
    pub case_description: String,
}

#[derive(Debug, Serialize)]
pub struct EnforcementApplicationResponse {
    pub request_no: String,
}

pub async fn create_enforcement_application(
    Json(_req): Json<CreateEnforcementApplicationRequest>,
) -> Result<(StatusCode, Json<EnforcementApplicationResponse>), StatusCode> {
    Err(StatusCode::NOT_IMPLEMENTED)
}

pub async fn get_enforcement_application(
    path: axum::extract::Path<String>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let _request_no = path.0;
    Err(StatusCode::NOT_IMPLEMENTED)
}
