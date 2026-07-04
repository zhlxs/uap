package com.aegisid.admin.app.interfaces.response;

import java.util.List;

public record MemberAuthorizationResponse(
        List<UserResponse> users,
        List<RoleResponse> roles,
        List<PermissionCodeResponse> permissionCodes,
        List<ScopeResponse> scopes,
        List<ResourceResponse> resources,
        List<MemberRoleGrantResponse> roleGrants,
        List<UserRoleAssignmentResponse> assignments
) {
}
