pub mod local;

pub use local::LocalStorage;

pub trait Storage: Send + Sync {
    fn save(&self, key: &str, data: &[u8]) -> std::io::Result<String>;
}
