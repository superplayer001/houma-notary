// JWT Authentication

use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum IdentityType {
    User,
    Staff,
}

impl IdentityType {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::User => "USER",
            Self::Staff => "STAFF",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,        // user/staff ID
    pub identity_type: IdentityType,
    pub exp: i64,           // expiration timestamp
}

pub fn verify_token(_token: &str) -> Result<Claims, String> {
    // TODO: Implement actual JWT verification
    Err("Not implemented".to_string())
}

pub fn extract_identity(_token: &str) -> Result<(Uuid, IdentityType), String> {
    // TODO: Implement actual token extraction
    Err("Not implemented".to_string())
}
