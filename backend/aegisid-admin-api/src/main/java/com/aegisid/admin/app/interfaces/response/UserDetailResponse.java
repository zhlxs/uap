package com.aegisid.admin.app.interfaces.response;

import java.util.List;

public record UserDetailResponse(
        UserResponse user,
        List<UserApplicationAuthorizationResponse> authorizations
) {
}
