package com.aegisid.admin.app.interfaces.controller;

import com.aegisid.admin.app.application.service.UserManagementService;
import com.aegisid.admin.app.interfaces.request.CreateUserRequest;
import com.aegisid.admin.app.interfaces.request.UpdateUserRequest;
import com.aegisid.admin.app.interfaces.response.UserDetailResponse;
import com.aegisid.admin.app.interfaces.response.UserResponse;
import com.aegisid.common.api.ApiResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/users")
public class UserController {
    private final UserManagementService userManagementService;

    public UserController(UserManagementService userManagementService) {
        this.userManagementService = userManagementService;
    }

    @PostMapping
    ApiResponse<UserResponse> create(@Valid @RequestBody CreateUserRequest request) {
        return ApiResponse.ok(userManagementService.createUser(request));
    }

    @GetMapping
    ApiResponse<List<UserResponse>> list() {
        return ApiResponse.ok(userManagementService.listUsers());
    }

    @GetMapping("/{userId}")
    ApiResponse<UserDetailResponse> get(@PathVariable String userId) {
        return ApiResponse.ok(userManagementService.getUser(userId));
    }

    @PutMapping("/{userId}")
    ApiResponse<UserResponse> update(
            @PathVariable String userId,
            @Valid @RequestBody UpdateUserRequest request
    ) {
        return ApiResponse.ok(userManagementService.updateUser(userId, request));
    }

    @PostMapping("/{userId}/enable")
    ApiResponse<UserResponse> enable(@PathVariable String userId) {
        return ApiResponse.ok(userManagementService.enableUser(userId));
    }

    @PostMapping("/{userId}/disable")
    ApiResponse<UserResponse> disable(@PathVariable String userId) {
        return ApiResponse.ok(userManagementService.disableUser(userId));
    }

    @PostMapping("/{userId}/lock")
    ApiResponse<UserResponse> lock(@PathVariable String userId) {
        return ApiResponse.ok(userManagementService.lockUser(userId));
    }
}
