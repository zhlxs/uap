package com.aegisid.admin.app.domain.model;

import java.util.Set;

public final class PermissionMode {
    public static final String SSO_ONLY = "sso_only";
    public static final String DELEGATED = "delegated";
    public static final String CENTRALIZED = "centralized";
    public static final String HYBRID = "hybrid";

    private static final Set<String> SUPPORTED_MODES = Set.of(SSO_ONLY, DELEGATED, CENTRALIZED, HYBRID);

    private PermissionMode() {
    }

    public static boolean isSupported(String permissionMode) {
        return SUPPORTED_MODES.contains(permissionMode);
    }

    public static String defaultCapabilitiesJson(String permissionMode) {
        return switch (permissionMode) {
            case SSO_ONLY -> """
                    {"app_access_control":false,"role_permission_enabled":false,\
                    "resource_managed_by_uap":{"menu":false,"button":false,"api":false},\
                    "data_scope_managed_by_uap":false,\
                    "permission_delivery":{"token_claims":false,"permission_api":false}}""";
            case DELEGATED -> """
                    {"app_access_control":true,"role_permission_enabled":true,\
                    "resource_managed_by_uap":{"menu":false,"button":false,"api":false},\
                    "data_scope_managed_by_uap":false,\
                    "permission_delivery":{"token_claims":true,"permission_api":true}}""";
            case CENTRALIZED -> """
                    {"app_access_control":true,"role_permission_enabled":true,\
                    "resource_managed_by_uap":{"menu":true,"button":true,"api":true},\
                    "data_scope_managed_by_uap":true,\
                    "permission_delivery":{"token_claims":false,"permission_api":true}}""";
            case HYBRID -> """
                    {"app_access_control":true,"role_permission_enabled":true,\
                    "resource_managed_by_uap":{"menu":true,"button":true,"api":true},\
                    "data_scope_managed_by_uap":false,\
                    "permission_delivery":{"token_claims":true,"permission_api":true}}""";
            default -> throw new IllegalArgumentException("Unsupported permission mode");
        };
    }
}
