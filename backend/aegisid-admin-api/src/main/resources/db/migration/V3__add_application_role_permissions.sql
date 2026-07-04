CREATE TABLE IF NOT EXISTS uap_permission_code (
    id VARCHAR(64) PRIMARY KEY,
    application_id VARCHAR(64) NOT NULL,
    permission_code VARCHAR(128) NOT NULL,
    permission_name VARCHAR(128) NOT NULL,
    description VARCHAR(512),
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_uap_permission_code_app_code
    ON uap_permission_code (application_id, permission_code);
CREATE INDEX IF NOT EXISTS idx_uap_permission_code_application_id
    ON uap_permission_code (application_id);

CREATE TABLE IF NOT EXISTS uap_scope (
    id VARCHAR(64) PRIMARY KEY,
    application_id VARCHAR(64) NOT NULL,
    scope_code VARCHAR(128) NOT NULL,
    scope_name VARCHAR(128) NOT NULL,
    description VARCHAR(512),
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_uap_scope_app_code
    ON uap_scope (application_id, scope_code);
CREATE INDEX IF NOT EXISTS idx_uap_scope_application_id
    ON uap_scope (application_id);

CREATE TABLE IF NOT EXISTS iam_role_permission (
    role_id VARCHAR(64) NOT NULL,
    permission_code_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    PRIMARY KEY (role_id, permission_code_id)
);

CREATE INDEX IF NOT EXISTS idx_iam_role_permission_permission_id
    ON iam_role_permission (permission_code_id);

CREATE TABLE IF NOT EXISTS iam_role_scope (
    role_id VARCHAR(64) NOT NULL,
    scope_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    PRIMARY KEY (role_id, scope_id)
);

CREATE INDEX IF NOT EXISTS idx_iam_role_scope_scope_id
    ON iam_role_scope (scope_id);
