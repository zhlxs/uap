-- 引导数据：管理后台应用、OAuth 客户端、平台管理员账号与权限
-- 该迁移只在初始化空库时插入基础身份数据，保证统一登录与权限 Token 开箱可用。

-- 管理后台应用
INSERT INTO uap_application (
    id, tenant_id, app_code, app_name, app_type, protocol,
    permission_mode, status, created_at, updated_at
) VALUES (
    'app-admin-console', 'default', 'aegisid-admin-console', 'AegisID 管理后台', 'web', 'oidc',
    'delegated', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- 管理后台 OAuth 客户端（公共客户端，PKCE，无密钥）
-- 多值字段以换行符分隔，与后端客户端解析约定一致。
INSERT INTO uap_oauth_client (
    id, application_id, client_id, client_name, client_type,
    token_endpoint_auth_method, grant_types, response_types,
    redirect_uris, post_logout_redirect_uris, scopes,
    access_token_ttl_seconds, refresh_token_ttl_seconds, require_pkce,
    status, created_at, updated_at
) VALUES (
    'client-admin-console', 'app-admin-console', 'aegisid-admin-console', 'AegisID 管理后台', 'public',
    'none',
    'authorization_code
refresh_token',
    'code',
    'http://localhost:5173/auth/callback
http://localhost:5174/auth/callback
http://127.0.0.1:5173/auth/callback
http://127.0.0.1:5174/auth/callback',
    'http://localhost:5173
http://localhost:5174
http://127.0.0.1:5173
http://127.0.0.1:5174',
    'openid
profile
email
offline_access',
    900, 604800, TRUE,
    'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- 平台管理员用户
INSERT INTO iam_user (
    id, tenant_id, display_name, real_name, email, user_type, status, created_at, updated_at
) VALUES (
    'user-admin', 'default', '平台管理员', '平台管理员', 'admin@aegisid.local', 'employee', 'active',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- 平台管理员登录凭据（口令 admin123，bcrypt 存储）
INSERT INTO iam_account (
    id, user_id, username, password_hash, password_algo, password_updated_at,
    failed_login_count, mfa_required, status, created_at, updated_at
) VALUES (
    'account-admin', 'user-admin', 'admin',
    '{bcrypt}$2b$10$4Ych.zL0ZX9/fDoZ0lZvJ.iQOt642vdQn4nNsgmzZut.1D5gNzNum', 'bcrypt', CURRENT_TIMESTAMP,
    0, FALSE, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- 平台管理员角色（归属管理后台应用）
INSERT INTO iam_role (
    id, tenant_id, application_id, role_code, role_name, role_type, status, created_at, updated_at
) VALUES (
    'role-platform-admin', 'default', 'app-admin-console', 'platform_admin', '平台管理员', 'system', 'active',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- 管理后台权限码
INSERT INTO uap_permission_code (id, application_id, permission_code, permission_name, status, created_at, updated_at) VALUES
    ('perm-console-access', 'app-admin-console', 'admin:console:access', '访问管理后台', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('perm-application-manage', 'app-admin-console', 'application:manage', '应用接入管理', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('perm-identity-read', 'app-admin-console', 'identity:user:read', '用户查询', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('perm-identity-write', 'app-admin-console', 'identity:user:write', '用户管理', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('perm-audit-read', 'app-admin-console', 'audit:log:read', '审计日志查询', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 角色-权限授予
INSERT INTO iam_role_permission (role_id, permission_code_id, created_at) VALUES
    ('role-platform-admin', 'perm-console-access', CURRENT_TIMESTAMP),
    ('role-platform-admin', 'perm-application-manage', CURRENT_TIMESTAMP),
    ('role-platform-admin', 'perm-identity-read', CURRENT_TIMESTAMP),
    ('role-platform-admin', 'perm-identity-write', CURRENT_TIMESTAMP),
    ('role-platform-admin', 'perm-audit-read', CURRENT_TIMESTAMP);

-- 管理后台 API 访问 scope
INSERT INTO uap_scope (id, application_id, scope_code, scope_name, status, created_at, updated_at) VALUES
    ('scope-admin-api', 'app-admin-console', 'admin.api', '管理后台 API 访问', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 角色-scope 授予
INSERT INTO iam_role_scope (role_id, scope_id, created_at) VALUES
    ('role-platform-admin', 'scope-admin-api', CURRENT_TIMESTAMP);

-- 用户-角色分配（归属管理后台应用）
INSERT INTO iam_user_role (user_id, role_id, application_id, created_at) VALUES
    ('user-admin', 'role-platform-admin', 'app-admin-console', CURRENT_TIMESTAMP);
