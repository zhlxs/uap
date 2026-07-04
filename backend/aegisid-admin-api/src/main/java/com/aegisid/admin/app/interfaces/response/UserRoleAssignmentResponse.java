package com.aegisid.admin.app.interfaces.response;

import java.util.List;

public record UserRoleAssignmentResponse(
        String userId,
        List<String> roleIds
) {
}
