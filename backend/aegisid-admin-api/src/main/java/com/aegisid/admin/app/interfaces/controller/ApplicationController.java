package com.aegisid.admin.app.interfaces.controller;

import com.aegisid.admin.app.interfaces.response.ApplicationModeResponse;
import com.aegisid.common.api.ApiResponse;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/applications")
public class ApplicationController {
    @GetMapping("/permission-modes")
    ApiResponse<List<ApplicationModeResponse>> permissionModes() {
        return ApiResponse.ok(List.of(
                new ApplicationModeResponse("sso_only", "仅统一登录"),
                new ApplicationModeResponse("delegated", "业务系统自管权限"),
                new ApplicationModeResponse("centralized", "UAP 统一托管权限"),
                new ApplicationModeResponse("hybrid", "混合模式")
        ));
    }
}

