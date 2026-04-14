use axum::{http::StatusCode, Extension, Json};
use axum_extra::extract::Multipart;
use sqlx::PgPool;
use uuid::Uuid;

use crate::auth::{verify_token, IdentityType};
use crate::services::application::{self, AppStatus};
use crate::services::material::{self, UploadMaterialInput};
use crate::storage::{local::LocalStorage, Storage};

use super::application::ApiError;

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

#[derive(Debug, serde::Serialize)]
pub struct MaterialResponse {
    pub id: String,
    pub application_id: String,
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
            application_id: m.application_id.to_string(),
            material_type: m.material_type,
            file_name: m.file_name,
            file_size: m.file_size,
            file_hash: m.file_hash,
            created_at: m.created_at.to_rfc3339(),
        }
    }
}

pub async fn upload_material(
    headers: axum::http::HeaderMap,
    Extension(pool): Extension<PgPool>,
    Extension(storage): Extension<LocalStorage>,
    path: axum::extract::Path<String>,
    mut multipart: Multipart,
) -> Result<Json<MaterialResponse>, (StatusCode, Json<ApiError>)> {
    let user_id = extract_user_id_from_headers(&headers)?;

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

    let app = match app {
        Some(a) => a,
        None => return Err((StatusCode::NOT_FOUND, Json(ApiError::not_found()))),
    };

    if app.applicant_user_id != user_id {
        return Err((StatusCode::FORBIDDEN, Json(ApiError::forbidden())));
    }

    if app.status != AppStatus::Draft.as_str()
        && app.status != AppStatus::SupplementRequired.as_str()
    {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ApiError::new(
                400,
                "can only upload materials to DRAFT or SUPPLEMENT_REQUIRED applications",
            )),
        ));
    }

    let mut material_type: Option<String> = None;
    let mut file_data: Option<Vec<u8>> = None;
    let mut original_file_name: Option<String> = None;

    while let Some(field) = multipart.next_field().await.map_err(|e| {
        (
            StatusCode::BAD_REQUEST,
            Json(ApiError::new(400, &format!("multipart error: {}", e))),
        )
    })? {
        let name = field.name().unwrap_or("").to_string();

        match name.as_str() {
            "material_type" => {
                let value = field.text().await.map_err(|e| {
                    (
                        StatusCode::BAD_REQUEST,
                        Json(ApiError::new(400, &format!("material_type error: {}", e))),
                    )
                })?;
                if value.trim().is_empty() {
                    return Err((
                        StatusCode::BAD_REQUEST,
                        Json(ApiError::new(400, "material_type cannot be empty")),
                    ));
                }
                material_type = Some(value);
            }
            "file" => {
                let filename = field.file_name().map(|s| s.to_string());
                let data = field.bytes().await.map_err(|e| {
                    (
                        StatusCode::BAD_REQUEST,
                        Json(ApiError::new(400, &format!("file read error: {}", e))),
                    )
                })?;
                original_file_name = filename;
                file_data = Some(data.to_vec());
            }
            _ => {}
        }
    }

    let material_type = material_type.ok_or((
        StatusCode::BAD_REQUEST,
        Json(ApiError::new(400, "material_type field is required")),
    ))?;

    let file_data = file_data.ok_or((
        StatusCode::BAD_REQUEST,
        Json(ApiError::new(400, "file field is required")),
    ))?;

    let original_filename = original_file_name.unwrap_or_else(|| "unknown".to_string());

    let file_size = file_data.len() as i64;
    let file_hash = material::compute_file_hash(&file_data);

    let stored_name = format!(
        "{}_{}.bin",
        Uuid::new_v4(),
        Uuid::new_v4().to_string().replace("-", "")
    );
    let relative_path = format!("applications/{}/{}", app_id, stored_name);

    storage.save(file_data, &relative_path).await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiError::new(500, &format!("storage error: {}", e))),
        )
    })?;

    let input = UploadMaterialInput {
        application_id: app_id,
        material_type,
        file_name: original_filename,
        stored_name,
        file_path: relative_path,
        file_size,
        file_hash,
        uploaded_by_user_id: user_id,
    };

    let mat = material::create_material(&pool, input).await.map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiError::internal_error()),
        )
    })?;

    Ok(Json(MaterialResponse::from(mat)))
}