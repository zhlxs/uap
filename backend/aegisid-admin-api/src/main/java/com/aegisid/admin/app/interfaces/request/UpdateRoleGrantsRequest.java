package com.aegisid.admin.app.interfaces.request;

import java.util.List;

public record UpdateRoleGrantsRequest(
        List<String> permissionCodeIds,
        List<String> scopeIds,
        List<String> resourceIds
) {
}
