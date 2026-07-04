package com.aegisid.auth.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Set;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class LogoutController {
    private static final Set<String> ALLOWED_REDIRECT_URIS = Set.of(
            "http://localhost:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174"
    );

    private final SecurityContextLogoutHandler logoutHandler = new SecurityContextLogoutHandler();

    @GetMapping("/sso/logout")
    void logout(
            @RequestParam(name = "redirect_uri", required = false) String redirectUri,
            Authentication authentication,
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {
        logoutHandler.logout(request, response, authentication);
        response.sendRedirect(resolveRedirectUri(redirectUri));
    }

    private static String resolveRedirectUri(String redirectUri) {
        if (redirectUri != null && ALLOWED_REDIRECT_URIS.contains(redirectUri)) {
            return redirectUri;
        }
        return "http://localhost:5173";
    }
}
