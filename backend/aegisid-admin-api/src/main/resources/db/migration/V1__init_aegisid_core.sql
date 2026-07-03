CREATE TABLE IF NOT EXISTS iam_user (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64),
    employee_no VARCHAR(64),
    display_name VARCHAR(128) NOT NULL,
    real_name VARCHAR(128),
    email VARCHAR(255),
    mobile VARCHAR(32),
    department_id VARCHAR(64),
    position_id VARCHAR(64),
    user_type VARCHAR(32) NOT NULL DEFAULT 'employee',
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    joined_at TIMESTAMP,
    left_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_iam_user_tenant_employee_no ON iam_user (tenant_id, employee_no);
CREATE INDEX IF NOT EXISTS idx_iam_user_department_id ON iam_user (department_id);
CREATE INDEX IF NOT EXISTS idx_iam_user_email ON iam_user (email);
CREATE INDEX IF NOT EXISTS idx_iam_user_mobile ON iam_user (mobile);
CREATE INDEX IF NOT EXISTS idx_iam_user_status ON iam_user (status);

CREATE TABLE IF NOT EXISTS iam_account (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    username VARCHAR(128) NOT NULL,
    password_hash VARCHAR(255),
    password_algo VARCHAR(32),
    password_updated_at TIMESTAMP,
    password_expires_at TIMESTAMP,
    failed_login_count INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMP,
    mfa_required BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_iam_account_username ON iam_account (username);
CREATE INDEX IF NOT EXISTS idx_iam_account_user_id ON iam_account (user_id);
CREATE INDEX IF NOT EXISTS idx_iam_account_status ON iam_account (status);

CREATE TABLE IF NOT EXISTS iam_department (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64),
    parent_id VARCHAR(64),
    name VARCHAR(128) NOT NULL,
    code VARCHAR(64) NOT NULL,
    path VARCHAR(1024),
    sort_order INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_iam_department_tenant_code ON iam_department (tenant_id, code);
CREATE INDEX IF NOT EXISTS idx_iam_department_parent_id ON iam_department (parent_id);
CREATE INDEX IF NOT EXISTS idx_iam_department_path ON iam_department (path);

CREATE TABLE IF NOT EXISTS uap_application (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64),
    app_code VARCHAR(64) NOT NULL,
    app_name VARCHAR(128) NOT NULL,
    app_type VARCHAR(32) NOT NULL,
    protocol VARCHAR(32) NOT NULL,
    owner_user_id VARCHAR(64),
    homepage_url VARCHAR(512),
    logo_url VARCHAR(512),
    login_policy_id VARCHAR(64),
    token_policy_id VARCHAR(64),
    permission_mode VARCHAR(32) NOT NULL DEFAULT 'delegated',
    permission_capabilities_json TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_uap_application_tenant_app_code ON uap_application (tenant_id, app_code);
CREATE INDEX IF NOT EXISTS idx_uap_application_owner_user_id ON uap_application (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_uap_application_status ON uap_application (status);

CREATE TABLE IF NOT EXISTS uap_oauth_client (
    id VARCHAR(64) PRIMARY KEY,
    application_id VARCHAR(64) NOT NULL,
    client_id VARCHAR(128) NOT NULL,
    client_name VARCHAR(128) NOT NULL,
    client_type VARCHAR(32) NOT NULL,
    token_endpoint_auth_method VARCHAR(64) NOT NULL,
    grant_types VARCHAR(512) NOT NULL,
    response_types VARCHAR(512) NOT NULL,
    redirect_uris TEXT,
    post_logout_redirect_uris TEXT,
    scopes VARCHAR(1024),
    access_token_ttl_seconds INTEGER NOT NULL DEFAULT 900,
    refresh_token_ttl_seconds INTEGER NOT NULL DEFAULT 604800,
    require_pkce BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_uap_oauth_client_client_id ON uap_oauth_client (client_id);
CREATE INDEX IF NOT EXISTS idx_uap_oauth_client_application_id ON uap_oauth_client (application_id);

CREATE TABLE IF NOT EXISTS iam_role (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64),
    application_id VARCHAR(64),
    role_code VARCHAR(64) NOT NULL,
    role_name VARCHAR(128) NOT NULL,
    role_type VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_iam_role_app_code ON iam_role (application_id, role_code);
CREATE INDEX IF NOT EXISTS idx_iam_role_tenant_id ON iam_role (tenant_id);

CREATE TABLE IF NOT EXISTS uap_resource (
    id VARCHAR(64) PRIMARY KEY,
    application_id VARCHAR(64) NOT NULL,
    parent_id VARCHAR(64),
    resource_code VARCHAR(128) NOT NULL,
    resource_name VARCHAR(128) NOT NULL,
    resource_type VARCHAR(32) NOT NULL,
    path VARCHAR(512),
    http_method VARCHAR(16),
    url_pattern VARCHAR(512),
    icon VARCHAR(128),
    component VARCHAR(255),
    sort_order INTEGER NOT NULL DEFAULT 0,
    visible BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_uap_resource_app_code ON uap_resource (application_id, resource_code);
CREATE INDEX IF NOT EXISTS idx_uap_resource_parent_id ON uap_resource (parent_id);
CREATE INDEX IF NOT EXISTS idx_uap_resource_type ON uap_resource (resource_type);

CREATE TABLE IF NOT EXISTS iam_role_resource (
    role_id VARCHAR(64) NOT NULL,
    resource_id VARCHAR(64) NOT NULL,
    effect VARCHAR(16) NOT NULL DEFAULT 'allow',
    created_at TIMESTAMP NOT NULL,
    PRIMARY KEY (role_id, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_iam_role_resource_resource_id ON iam_role_resource (resource_id);

CREATE TABLE IF NOT EXISTS audit_event (
    id VARCHAR(64) PRIMARY KEY,
    trace_id VARCHAR(128),
    tenant_id VARCHAR(64),
    event_type VARCHAR(64) NOT NULL,
    actor_user_id VARCHAR(64),
    target_type VARCHAR(64),
    target_id VARCHAR(128),
    client_id VARCHAR(128),
    ip VARCHAR(64),
    user_agent VARCHAR(1024),
    result VARCHAR(32) NOT NULL,
    error_code VARCHAR(64),
    detail_json TEXT,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_event_created_at ON audit_event (created_at);
CREATE INDEX IF NOT EXISTS idx_audit_event_type ON audit_event (event_type);
CREATE INDEX IF NOT EXISTS idx_audit_event_actor_user_id ON audit_event (actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_event_client_id ON audit_event (client_id);
CREATE INDEX IF NOT EXISTS idx_audit_event_trace_id ON audit_event (trace_id);

