// JWT Authentication
// HS256 symmetric signing, secret from JWT_SECRET env var

use hex::FromHex;
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::sync::RwLock;
use uuid::Uuid;

// Global JWT secret (loaded once at startup, 32 bytes for HS256)
static JWT_SECRET: Lazy<RwLock<Vec<u8>>> = Lazy::new(|| RwLock::new(Vec::new()));

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
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

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "USER" => Some(Self::User),
            "STAFF" => Some(Self::Staff),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,         // user/staff ID (UUID string)
    pub identity_type: IdentityType,
    pub username: String,
    pub exp: i64,            // expiration timestamp (Unix epoch seconds)
}

impl Claims {
    pub fn user_id(&self) -> Uuid {
        Uuid::parse_str(&self.sub).expect("invalid UUID in claims sub")
    }
}

/// Initialize JWT secret from environment variable.
/// Must call once at application startup.
pub fn init_jwt_secret() {
    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| {
        // Fallback for development only
        tracing::warn!(
            "JWT_SECRET not set, using insecure dev secret. \
            Set JWT_SECRET env var for production!"
        );
        "dev-secret-do-not-use-in-production-houma-notary".to_string()
    });

    let secret_bytes = if secret.len() >= 32 {
        // Raw secret: hash to get consistent 32 bytes for HS256
        let hash = Sha256::digest(secret.as_bytes());
        hash.to_vec()
    } else {
        // Hex-encoded secret (64 hex chars = 32 bytes)
        <[u8; 32]>::from_hex(&secret)
            .map(|arr| arr.to_vec())
            .unwrap_or_else(|_| {
                // Plain string too short: hash it
                let hash = Sha256::digest(secret.as_bytes());
                hash.to_vec()
            })
    };

    let secret_len = secret_bytes.len();
    *JWT_SECRET.write().unwrap() = secret_bytes;
    tracing::info!("JWT secret initialized ({} bytes)", secret_len);
}

fn get_secret() -> Vec<u8> {
    JWT_SECRET.read().unwrap().clone()
}

/// Generate a JWT token.
pub fn generate_token(
    id: Uuid,
    identity_type: IdentityType,
    username: &str,
    expires_in_secs: i64,
) -> Result<String, jsonwebtoken::errors::Error> {
    let now = chrono::Utc::now().timestamp();
    let claims = Claims {
        sub: id.to_string(),
        identity_type,
        username: username.to_string(),
        exp: now + expires_in_secs,
    };

    let header = Header::new(Algorithm::HS256);
    encode(
        &header,
        &claims,
        &EncodingKey::from_secret(&get_secret()),
    )
}

/// Verify and decode a JWT token. Returns Claims on success.
pub fn verify_token(token: &str) -> Result<Claims, String> {
    let validation = Validation::new(Algorithm::HS256);

    decode::<Claims>(
        token,
        &DecodingKey::from_secret(&get_secret()),
        &validation,
    )
    .map_err(|e| format!("invalid token: {}", e))
    .map(|data| data.claims)
}

/// Extract (id, identity_type) from a JWT token.
pub fn extract_identity(token: &str) -> Result<(Uuid, IdentityType), String> {
    let claims = verify_token(token)?;
    Ok((claims.user_id(), claims.identity_type))
}

/// Hash a password using SHA-256 with a static salt prefix.
/// MVP: uses sha256("houma-notary-v1:" + password).
/// Production should use bcrypt or argon2.
pub fn hash_password(password: &str) -> String {
    let salt = "houma-notary-v1:";
    let mut hasher = Sha256::new();
    hasher.update(salt.as_bytes());
    hasher.update(password.as_bytes());
    let result = hasher.finalize();
    format!("sha256:{}", hex::encode(result))
}

/// Verify a password against a stored hash.
pub fn verify_password(password: &str, stored_hash: &str) -> bool {
    let computed = hash_password(password);
    constant_time_compare(&computed, stored_hash)
}

/// Constant-time string comparison to prevent timing attacks.
fn constant_time_compare(a: &str, b: &str) -> bool {
    if a.len() != b.len() {
        return false;
    }
    a.bytes()
        .zip(b.bytes())
        .fold(0u8, |acc, (x, y)| acc | (x ^ y))
        == 0
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_password_hash_verify() {
        let hash = hash_password("test123");
        assert!(verify_password("test123", &hash));
        assert!(!verify_password("wrong", &hash));
    }

    #[test]
    fn test_token_roundtrip() {
        init_jwt_secret();
        let id = Uuid::new_v4();
        let token = generate_token(id, IdentityType::User, "testuser", 3600).unwrap();
        let claims = verify_token(&token).unwrap();
        assert_eq!(claims.sub, id.to_string());
        assert_eq!(claims.identity_type, IdentityType::User);
        assert_eq!(claims.username, "testuser");
    }
}
