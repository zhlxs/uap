package com.aegisid.admin.web;

import com.aegisid.common.api.ApiResponse;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/me")
public class CurrentUserController {
    @GetMapping
    ApiResponse<CurrentUserResponse> currentUser(Authentication authentication) {
        Jwt jwt = ((JwtAuthenticationToken) authentication).getToken();
        String username = claimAsString(jwt, "preferred_username", authentication.getName());
        return ApiResponse.ok(new CurrentUserResponse(
                jwt.getSubject(),
                username,
                "默认组织",
                List.of("平台管理员"),
                List.of("admin:console:access")
        ));
    }

    private static String claimAsString(Jwt jwt, String claimName, String fallback) {
        Object value = jwt.getClaims().get(claimName);
        if (value == null) {
            return fallback;
        }
        return String.valueOf(value);
    }

    public record CurrentUserResponse(
            String subject,
            String username,
            String tenantName,
            List<String> roles,
            List<String> permissions
    ) {
    }
}
