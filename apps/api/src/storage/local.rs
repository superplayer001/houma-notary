use std::path::PathBuf;

use crate::storage::Storage;

#[derive(Clone)]
pub struct LocalStorage {
    base: PathBuf,
}

impl LocalStorage {
    pub fn from_env() -> Self {
        let base = std::env::var("STORAGE_PATH")
            .map(PathBuf::from)
            .unwrap_or_else(|_| PathBuf::from("storage"));
        Self { base }
    }

    pub fn base_path(&self) -> &PathBuf {
        &self.base
    }
}

impl Storage for LocalStorage {
    fn save(&self, key: &str, data: &[u8]) -> std::io::Result<String> {
        let path = self.base.join(key);
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        std::fs::write(&path, data)?;
        Ok(path.to_string_lossy().to_string())
    }
}
