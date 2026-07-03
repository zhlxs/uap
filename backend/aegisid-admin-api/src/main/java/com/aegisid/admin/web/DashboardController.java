package com.aegisid.admin.web;

import com.aegisid.common.api.ApiResponse;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/dashboard")
public class DashboardController {
    @GetMapping("/summary")
    ApiResponse<Map<String, Object>> summary() {
        return ApiResponse.ok(Map.of(
                "applications", 0,
                "users", 0,
                "activeSessions", 0,
                "riskEvents", 0,
                "modules", List.of("identity", "applications", "permissions", "policies", "audit")
        ));
    }
}

