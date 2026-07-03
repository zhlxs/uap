package com.aegisid.admin.app.interfaces.controller;

import com.aegisid.admin.app.application.command.CreateApplicationCommand;
import com.aegisid.admin.app.application.command.CreateOAuthClientCommand;
import com.aegisid.admin.app.application.query.CreatedClientSecret;
import com.aegisid.admin.app.application.service.ApplicationManagementService;
import com.aegisid.admin.app.domain.model.Application;
import com.aegisid.admin.app.domain.model.OAuthClient;
import com.aegisid.admin.app.domain.model.PermissionMode;
import com.aegisid.admin.app.interfaces.request.CreateApplicationRequest;
import com.aegisid.admin.app.interfaces.request.CreateOAuthClientRequest;
import com.aegisid.admin.app.interfaces.response.ApplicationModeResponse;
import com.aegisid.admin.app.interfaces.response.ApplicationResponse;
import com.aegisid.admin.app.interfaces.response.CreatedClientSecretResponse;
import com.aegisid.admin.app.interfaces.response.OAuthClientResponse;
import com.aegisid.common.api.ApiResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/applications")
public class ApplicationController {
    private final ApplicationManagementService applicationManagementService;

    public ApplicationController(ApplicationManagementService applicationManagementService) {
        this.applicationManagementService = applicationManagementService;
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

    @GetMapping("/permission-modes")
    ApiResponse<List<ApplicationModeResponse>> permissionModes() {
        return ApiResponse.ok(List.of(
                new ApplicationModeResponse(PermissionMode.SSO_ONLY, "SSO only"),
                new ApplicationModeResponse(PermissionMode.DELEGATED, "Delegated authorization"),
                new ApplicationModeResponse(PermissionMode.CENTRALIZED, "Centralized authorization"),
                new ApplicationModeResponse(PermissionMode.HYBRID, "Hybrid authorization")
        ));
    }
}
