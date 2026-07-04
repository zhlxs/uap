package com.aegisid.admin.app.interfaces.controller;

import com.aegisid.admin.app.application.service.DepartmentManagementService;
import com.aegisid.admin.app.interfaces.request.CreateDepartmentRequest;
import com.aegisid.admin.app.interfaces.request.UpdateDepartmentRequest;
import com.aegisid.admin.app.interfaces.response.DepartmentResponse;
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
@RequestMapping("/api/admin/departments")
public class DepartmentController {
    private final DepartmentManagementService departmentManagementService;

    public DepartmentController(DepartmentManagementService departmentManagementService) {
        this.departmentManagementService = departmentManagementService;
    }

    @GetMapping
    ApiResponse<List<DepartmentResponse>> list() {
        return ApiResponse.ok(departmentManagementService.listDepartments());
    }

    @PostMapping
    ApiResponse<DepartmentResponse> create(@Valid @RequestBody CreateDepartmentRequest request) {
        return ApiResponse.ok(departmentManagementService.createDepartment(request));
    }

    @PutMapping("/{departmentId}")
    ApiResponse<DepartmentResponse> update(
            @PathVariable String departmentId,
            @Valid @RequestBody UpdateDepartmentRequest request
    ) {
        return ApiResponse.ok(departmentManagementService.updateDepartment(departmentId, request));
    }

    @PostMapping("/{departmentId}/enable")
    ApiResponse<DepartmentResponse> enable(@PathVariable String departmentId) {
        return ApiResponse.ok(departmentManagementService.enableDepartment(departmentId));
    }

    @PostMapping("/{departmentId}/disable")
    ApiResponse<DepartmentResponse> disable(@PathVariable String departmentId) {
        return ApiResponse.ok(departmentManagementService.disableDepartment(departmentId));
    }
}
