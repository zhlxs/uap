package com.aegisid.admin.app.interfaces.response;

import java.util.List;

public record PermissionConfigResponse(
        List<RoleResponse> roles,
        List<PermissionCodeResponse> permissionCodes,
        List<ScopeResponse> scopes,
        List<ResourceResponse> resources,
        List<RoleGrantResponse> roleGrants
) {
}
