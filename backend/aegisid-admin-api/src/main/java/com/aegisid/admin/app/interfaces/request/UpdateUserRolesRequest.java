package com.aegisid.admin.app.interfaces.request;

import java.util.List;

public record UpdateUserRolesRequest(
        List<String> roleIds
) {
}
