package com.aegisid.admin.app.interfaces.response;

import java.util.List;

public record RoleGrantResponse(
        String roleId,
        List<String> permissionCodeIds,
        List<String> scopeIds,
        List<String> resourceIds
) {
}
