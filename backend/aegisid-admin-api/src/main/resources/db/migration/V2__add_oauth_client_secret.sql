CREATE TABLE IF NOT EXISTS uap_client_secret (
    id VARCHAR(64) PRIMARY KEY,
    client_id VARCHAR(128) NOT NULL,
    secret_hash VARCHAR(255) NOT NULL,
    secret_hint VARCHAR(32) NOT NULL,
    active_from TIMESTAMP NOT NULL,
    expires_at TIMESTAMP,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_uap_client_secret_client_id ON uap_client_secret (client_id);
CREATE INDEX IF NOT EXISTS idx_uap_client_secret_status ON uap_client_secret (status);

