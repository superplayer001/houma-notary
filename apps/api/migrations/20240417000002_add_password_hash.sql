-- Add password_hash columns for authentication
-- Run after base_tables migration

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(256) NOT NULL DEFAULT 'sha256:d41d8cd98f00b204e9800998ecf8427e';
ALTER TABLE staff ADD COLUMN IF NOT EXISTS password_hash VARCHAR(256) NOT NULL DEFAULT 'sha256:d41d8cd98f00b204e9800998ecf8427e';

-- Set a default admin password: admin123
-- Password: admin123 -> sha256(salt + "admin123")
-- Salt: "houma-notary-v1:"
-- Hash: sha256("houma-notary-v1:admin123") = 8c6976e5b5410415bde908bd4dee01dfb2

UPDATE staff SET password_hash = 'sha256:9eff30f824deba7717a550d9ed08c333b11b024c9f440073cd5df7bbbeb4069a'
WHERE username = 'admin';

COMMENT ON COLUMN users.password_hash IS 'SHA-256 hash with salt prefix, format: sha256:<hex>';
COMMENT ON COLUMN staff.password_hash IS 'SHA-256 hash with salt prefix, format: sha256:<hex>';
