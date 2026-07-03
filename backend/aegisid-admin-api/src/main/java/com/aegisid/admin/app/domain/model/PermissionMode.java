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
}

