package com.aegisid.admin.app.interfaces.controller;

import com.aegisid.admin.app.application.command.CreateApplicationCommand;
import com.aegisid.admin.app.application.command.CreateOAuthClientCommand;
import com.aegisid.admin.app.application.command.UpdatePermissionPolicyCommand;
import com.aegisid.admin.app.application.query.CreatedClientSecret;
import com.aegisid.admin.app.application.service.ApplicationManagementService;
import com.aegisid.admin.app.application.service.ApplicationPermissionService;
import com.aegisid.admin.app.application.service.MemberAuthorizationService;
import com.aegisid.admin.app.domain.model.Application;
import com.aegisid.admin.app.domain.model.OAuthClient;
import com.aegisid.admin.app.domain.model.PermissionMode;
import com.aegisid.admin.app.interfaces.request.CreateApplicationRequest;
import com.aegisid.admin.app.interfaces.request.CreateOAuthClientRequest;
import com.aegisid.admin.app.interfaces.request.CreatePermissionCodeRequest;
import com.aegisid.admin.app.interfaces.request.CreateResourceRequest;
import com.aegisid.admin.app.interfaces.request.CreateRoleRequest;
import com.aegisid.admin.app.interfaces.request.CreateScopeRequest;
import com.aegisid.admin.app.interfaces.request.CreateUserRequest;
import com.aegisid.admin.app.interfaces.request.UpdatePermissionPolicyRequest;
import com.aegisid.admin.app.interfaces.request.UpdateRoleGrantsRequest;
import com.aegisid.admin.app.interfaces.request.UpdateUserRequest;
import com.aegisid.admin.app.interfaces.request.UpdateUserRolesRequest;
import com.aegisid.admin.app.interfaces.response.ApplicationModeResponse;
import com.aegisid.admin.app.interfaces.response.ApplicationResponse;
import com.aegisid.admin.app.interfaces.response.CreatedClientSecretResponse;
import com.aegisid.admin.app.interfaces.response.MemberAuthorizationResponse;
import com.aegisid.admin.app.interfaces.response.OAuthClientResponse;
import com.aegisid.admin.app.interfaces.response.PermissionCodeResponse;
import com.aegisid.admin.app.interfaces.response.PermissionConfigResponse;
import com.aegisid.admin.app.interfaces.response.ResourceResponse;
import com.aegisid.admin.app.interfaces.response.RoleGrantResponse;
import com.aegisid.admin.app.interfaces.response.RoleResponse;
import com.aegisid.admin.app.interfaces.response.ScopeResponse;
import com.aegisid.admin.app.interfaces.response.UserResponse;
import com.aegisid.admin.app.interfaces.response.UserDetailResponse;
import com.aegisid.admin.app.interfaces.response.UserRoleAssignmentResponse;
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
@RequestMapping("/api/admin/applications")
public class ApplicationController {
    private final ApplicationManagementService applicationManagementService;
    private final ApplicationPermissionService applicationPermissionService;
    private final MemberAuthorizationService memberAuthorizationService;

    public ApplicationController(
            ApplicationManagementService applicationManagementService,
            ApplicationPermissionService applicationPermissionService,
            MemberAuthorizationService memberAuthorizationService
    ) {
        this.applicationManagementService = applicationManagementService;
        this.applicationPermissionService = applicationPermissionService;
        this.memberAuthorizationService = memberAuthorizationService;
    }

    @PostMapping
    ApiResponse<ApplicationResponse> create(@Valid @RequestBody CreateApplicationRequest request) {
        Application application = applicationManagementService.create(new CreateApplicationCommand(
                request.appCode(),
                request.appName(),
                request.appType(),
                request.protocol(),
                request.homepageUrl(),
                request.permissionMode(),
                request.permissionCapabilitiesJson()
        ));
        return ApiResponse.ok(ApplicationResponse.from(application));
    }

    @GetMapping
    ApiResponse<List<ApplicationResponse>> list() {
        return ApiResponse.ok(applicationManagementService.list()
                .stream()
                .map(ApplicationResponse::from)
                .toList());
    }

    @GetMapping("/{id}")
    ApiResponse<ApplicationResponse> get(@PathVariable String id) {
        return ApiResponse.ok(ApplicationResponse.from(applicationManagementService.get(id)));
    }

    @PostMapping("/{id}/enable")
    ApiResponse<ApplicationResponse> enable(@PathVariable String id) {
        return ApiResponse.ok(ApplicationResponse.from(applicationManagementService.enable(id)));
    }

    @PostMapping("/{id}/disable")
    ApiResponse<ApplicationResponse> disable(@PathVariable String id) {
        return ApiResponse.ok(ApplicationResponse.from(applicationManagementService.disable(id)));
    }

    @PutMapping("/{id}/permission-policy")
    ApiResponse<ApplicationResponse> updatePermissionPolicy(
            @PathVariable String id,
            @Valid @RequestBody UpdatePermissionPolicyRequest request
    ) {
        Application application = applicationManagementService.updatePermissionPolicy(new UpdatePermissionPolicyCommand(
                id,
                request.permissionMode(),
                request.permissionCapabilitiesJson(),
                request.resetCapabilities()
        ));
        return ApiResponse.ok(ApplicationResponse.from(application));
    }

    @PostMapping("/{id}/oauth-clients")
    ApiResponse<OAuthClientResponse> createOAuthClient(
            @PathVariable String id,
            @Valid @RequestBody CreateOAuthClientRequest request
    ) {
        OAuthClient oauthClient = applicationManagementService.createOAuthClient(new CreateOAuthClientCommand(
                id,
                request.clientName(),
                request.clientType(),
                request.tokenEndpointAuthMethod(),
                request.grantTypes(),
                request.responseTypes(),
                request.redirectUris(),
                request.postLogoutRedirectUris(),
                request.scopes(),
                request.accessTokenTtlSeconds(),
                request.refreshTokenTtlSeconds(),
                request.requirePkce()
        ));
        return ApiResponse.ok(OAuthClientResponse.from(oauthClient));
    }

    @GetMapping("/{id}/oauth-clients")
    ApiResponse<List<OAuthClientResponse>> listOAuthClients(@PathVariable String id) {
        return ApiResponse.ok(applicationManagementService.listOAuthClients(id)
                .stream()
                .map(OAuthClientResponse::from)
                .toList());
    }

    @PostMapping("/oauth-clients/{clientId}/secrets")
    ApiResponse<CreatedClientSecretResponse> createClientSecret(@PathVariable String clientId) {
        CreatedClientSecret secret = applicationManagementService.createClientSecret(clientId);
        return ApiResponse.ok(CreatedClientSecretResponse.from(secret));
    }

    @GetMapping("/{id}/permission-config")
    ApiResponse<PermissionConfigResponse> permissionConfig(@PathVariable String id) {
        return ApiResponse.ok(applicationPermissionService.getConfig(id));
    }

    @PostMapping("/{id}/roles")
    ApiResponse<RoleResponse> createRole(
            @PathVariable String id,
            @Valid @RequestBody CreateRoleRequest request
    ) {
        return ApiResponse.ok(applicationPermissionService.createRole(id, request));
    }

    @PostMapping("/{id}/permission-codes")
    ApiResponse<PermissionCodeResponse> createPermissionCode(
            @PathVariable String id,
            @Valid @RequestBody CreatePermissionCodeRequest request
    ) {
        return ApiResponse.ok(applicationPermissionService.createPermissionCode(id, request));
    }

    @PostMapping("/{id}/scopes")
    ApiResponse<ScopeResponse> createScope(
            @PathVariable String id,
            @Valid @RequestBody CreateScopeRequest request
    ) {
        return ApiResponse.ok(applicationPermissionService.createScope(id, request));
    }

    @PostMapping("/{id}/resources")
    ApiResponse<ResourceResponse> createResource(
            @PathVariable String id,
            @Valid @RequestBody CreateResourceRequest request
    ) {
        return ApiResponse.ok(applicationPermissionService.createResource(id, request));
    }

    @PutMapping("/roles/{roleId}/grants")
    ApiResponse<RoleGrantResponse> updateRoleGrants(
            @PathVariable String roleId,
            @RequestBody UpdateRoleGrantsRequest request
    ) {
        return ApiResponse.ok(applicationPermissionService.updateRoleGrants(roleId, request));
    }

    @GetMapping("/{id}/member-authorization")
    ApiResponse<MemberAuthorizationResponse> memberAuthorization(@PathVariable String id) {
        return ApiResponse.ok(memberAuthorizationService.getConfig(id));
    }

    @PostMapping("/users")
    ApiResponse<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        return ApiResponse.ok(memberAuthorizationService.createUser(request));
    }

    @GetMapping("/users")
    ApiResponse<List<UserResponse>> listUsers() {
        return ApiResponse.ok(memberAuthorizationService.listUsers());
    }

    @GetMapping("/users/{userId}")
    ApiResponse<UserDetailResponse> getUser(@PathVariable String userId) {
        return ApiResponse.ok(memberAuthorizationService.getUser(userId));
    }

    @PutMapping("/users/{userId}")
    ApiResponse<UserResponse> updateUser(
            @PathVariable String userId,
            @Valid @RequestBody UpdateUserRequest request
    ) {
        return ApiResponse.ok(memberAuthorizationService.updateUser(userId, request));
    }

    @PostMapping("/users/{userId}/enable")
    ApiResponse<UserResponse> enableUser(@PathVariable String userId) {
        return ApiResponse.ok(memberAuthorizationService.enableUser(userId));
    }

    @PostMapping("/users/{userId}/disable")
    ApiResponse<UserResponse> disableUser(@PathVariable String userId) {
        return ApiResponse.ok(memberAuthorizationService.disableUser(userId));
    }

    @PostMapping("/users/{userId}/lock")
    ApiResponse<UserResponse> lockUser(@PathVariable String userId) {
        return ApiResponse.ok(memberAuthorizationService.lockUser(userId));
    }

    @PutMapping("/{id}/users/{userId}/roles")
    ApiResponse<UserRoleAssignmentResponse> updateUserRoles(
            @PathVariable String id,
            @PathVariable String userId,
            @RequestBody UpdateUserRolesRequest request
    ) {
        return ApiResponse.ok(memberAuthorizationService.updateUserRoles(id, userId, request));
    }

    @GetMapping("/permission-modes")
    ApiResponse<List<ApplicationModeResponse>> permissionModes() {
        return ApiResponse.ok(List.of(
                new ApplicationModeResponse(
                        PermissionMode.SSO_ONLY,
                        "仅统一登录",
                        PermissionMode.defaultCapabilitiesJson(PermissionMode.SSO_ONLY)
                ),
                new ApplicationModeResponse(
                        PermissionMode.DELEGATED,
                        "业务系统自管权限",
                        PermissionMode.defaultCapabilitiesJson(PermissionMode.DELEGATED)
                ),
                new ApplicationModeResponse(
                        PermissionMode.CENTRALIZED,
                        "UAP 统一管理权限",
                        PermissionMode.defaultCapabilitiesJson(PermissionMode.CENTRALIZED)
                ),
                new ApplicationModeResponse(
                        PermissionMode.HYBRID,
                        "混合权限管理",
                        PermissionMode.defaultCapabilitiesJson(PermissionMode.HYBRID)
                )
        ));
    }
}
