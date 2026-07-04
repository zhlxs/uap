package com.aegisid.admin.app.interfaces.response;

import java.util.List;

public record MemberAuthorizationResponse(
        List<UserResponse> users,
        List<RoleResponse> roles,
        List<UserRoleAssignmentResponse> assignments
) {
}
