package com.aegisid.admin.app.application.service;

import com.aegisid.admin.app.infrastructure.persistence.entity.PermissionCodeEntity;
import com.aegisid.admin.app.infrastructure.persistence.entity.ResourceEntity;
import com.aegisid.admin.app.infrastructure.persistence.entity.RoleEntity;
import com.aegisid.admin.app.infrastructure.persistence.entity.RolePermissionEntity;
import com.aegisid.admin.app.infrastructure.persistence.entity.RoleResourceEntity;
import com.aegisid.admin.app.infrastructure.persistence.entity.RoleScopeEntity;
import com.aegisid.admin.app.infrastructure.persistence.entity.ScopeEntity;
import com.aegisid.admin.app.infrastructure.persistence.entity.UserEntity;
import com.aegisid.admin.app.infrastructure.persistence.entity.UserRoleEntity;
import com.aegisid.admin.app.infrastructure.persistence.mapper.PermissionCodeMapper;
import com.aegisid.admin.app.infrastructure.persistence.mapper.ResourceMapper;
import com.aegisid.admin.app.infrastructure.persistence.mapper.RoleMapper;
import com.aegisid.admin.app.infrastructure.persistence.mapper.RolePermissionMapper;
import com.aegisid.admin.app.infrastructure.persistence.mapper.RoleResourceMapper;
import com.aegisid.admin.app.infrastructure.persistence.mapper.RoleScopeMapper;
import com.aegisid.admin.app.infrastructure.persistence.mapper.ScopeMapper;
import com.aegisid.admin.app.infrastructure.persistence.mapper.UserRoleMapper;
import com.aegisid.admin.app.interfaces.request.UpdateUserRolesRequest;
import com.aegisid.admin.app.interfaces.response.MemberAuthorizationResponse;
import com.aegisid.admin.app.interfaces.response.MemberRoleGrantResponse;
import com.aegisid.admin.app.interfaces.response.PermissionCodeResponse;
import com.aegisid.admin.app.interfaces.response.ResourceResponse;
import com.aegisid.admin.app.interfaces.response.RoleResponse;
import com.aegisid.admin.app.interfaces.response.ScopeResponse;
import com.aegisid.admin.app.interfaces.response.UserResponse;
import com.aegisid.admin.app.interfaces.response.UserRoleAssignmentResponse;
import com.aegisid.common.api.ErrorCode;
import com.aegisid.common.exception.BusinessException;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MemberAuthorizationService {
    private final ApplicationManagementService applicationManagementService;
    private final UserManagementService userManagementService;
    private final AuditEventService auditEventService;
    private final RoleMapper roleMapper;
    private final PermissionCodeMapper permissionCodeMapper;
    private final ScopeMapper scopeMapper;
    private final ResourceMapper resourceMapper;
    private final RolePermissionMapper rolePermissionMapper;
    private final RoleScopeMapper roleScopeMapper;
    private final RoleResourceMapper roleResourceMapper;
    private final UserRoleMapper userRoleMapper;

    public MemberAuthorizationService(
            ApplicationManagementService applicationManagementService,
            UserManagementService userManagementService,
            AuditEventService auditEventService,
            RoleMapper roleMapper,
            PermissionCodeMapper permissionCodeMapper,
            ScopeMapper scopeMapper,
            ResourceMapper resourceMapper,
            RolePermissionMapper rolePermissionMapper,
            RoleScopeMapper roleScopeMapper,
            RoleResourceMapper roleResourceMapper,
            UserRoleMapper userRoleMapper
    ) {
        this.applicationManagementService = applicationManagementService;
        this.userManagementService = userManagementService;
        this.auditEventService = auditEventService;
        this.roleMapper = roleMapper;
        this.permissionCodeMapper = permissionCodeMapper;
        this.scopeMapper = scopeMapper;
        this.resourceMapper = resourceMapper;
        this.rolePermissionMapper = rolePermissionMapper;
        this.roleScopeMapper = roleScopeMapper;
        this.roleResourceMapper = roleResourceMapper;
        this.userRoleMapper = userRoleMapper;
    }

    public MemberAuthorizationResponse getConfig(String applicationId) {
        applicationManagementService.get(applicationId);
        List<UserEntity> users = userManagementService.listUserEntities();
        List<RoleEntity> roles = listRoles(applicationId);
        List<PermissionCodeEntity> permissionCodes = listPermissionCodes(applicationId);
        List<ScopeEntity> scopes = listScopes(applicationId);
        List<ResourceEntity> resources = listResources(applicationId);
        List<MemberRoleGrantResponse> roleGrants = roles.stream()
                .map(role -> new MemberRoleGrantResponse(
                        role.getId(),
                        findPermissionCodeIds(role.getId()),
                        findScopeIds(role.getId()),
                        findResourceIds(role.getId())
                ))
                .toList();
        List<UserRoleAssignmentResponse> assignments = users.stream()
                .map(user -> new UserRoleAssignmentResponse(user.getId(), findRoleIds(applicationId, user.getId())))
                .toList();
        return new MemberAuthorizationResponse(
                users.stream().map(UserResponse::from).toList(),
                roles.stream().map(RoleResponse::from).toList(),
                permissionCodes.stream().map(PermissionCodeResponse::from).toList(),
                scopes.stream().map(ScopeResponse::from).toList(),
                resources.stream().map(ResourceResponse::from).toList(),
                roleGrants,
                assignments
        );
    }

    @Transactional
    public UserRoleAssignmentResponse updateUserRoles(
            String applicationId,
            String userId,
            UpdateUserRolesRequest request
    ) {
        applicationManagementService.get(applicationId);
        userManagementService.getUserEntity(userId);
        List<String> roleIds = request.roleIds() == null ? List.of() : request.roleIds();
        validateRoles(applicationId, roleIds);
        userRoleMapper.delete(Wrappers.<UserRoleEntity>lambdaQuery()
                .eq(UserRoleEntity::getApplicationId, applicationId)
                .eq(UserRoleEntity::getUserId, userId));
        LocalDateTime now = LocalDateTime.now();
        roleIds.forEach(roleId -> {
            UserRoleEntity entity = new UserRoleEntity();
            entity.setApplicationId(applicationId);
            entity.setUserId(userId);
            entity.setRoleId(roleId);
            entity.setCreatedAt(now);
            userRoleMapper.insert(entity);
        });
        auditEventService.recordSuccess(
                "iam.user.role.update",
                "iam_user",
                userId,
                auditEventService.detail(Map.of(
                        "applicationId", applicationId,
                        "roleIds", roleIds
                ))
        );
        return new UserRoleAssignmentResponse(userId, roleIds);
    }

    private List<RoleEntity> listRoles(String applicationId) {
        return roleMapper.selectList(Wrappers.<RoleEntity>lambdaQuery()
                .eq(RoleEntity::getApplicationId, applicationId)
                .orderByAsc(RoleEntity::getRoleCode));
    }

    private List<PermissionCodeEntity> listPermissionCodes(String applicationId) {
        return permissionCodeMapper.selectList(Wrappers.<PermissionCodeEntity>lambdaQuery()
                .eq(PermissionCodeEntity::getApplicationId, applicationId)
                .orderByAsc(PermissionCodeEntity::getPermissionCode));
    }

    private List<ScopeEntity> listScopes(String applicationId) {
        return scopeMapper.selectList(Wrappers.<ScopeEntity>lambdaQuery()
                .eq(ScopeEntity::getApplicationId, applicationId)
                .orderByAsc(ScopeEntity::getScopeCode));
    }

    private List<ResourceEntity> listResources(String applicationId) {
        return resourceMapper.selectList(Wrappers.<ResourceEntity>lambdaQuery()
                .eq(ResourceEntity::getApplicationId, applicationId)
                .orderByAsc(ResourceEntity::getSortOrder)
                .orderByAsc(ResourceEntity::getResourceCode));
    }

    private List<String> findRoleIds(String applicationId, String userId) {
        return userRoleMapper.selectList(Wrappers.<UserRoleEntity>lambdaQuery()
                        .eq(UserRoleEntity::getApplicationId, applicationId)
                        .eq(UserRoleEntity::getUserId, userId))
                .stream()
                .map(UserRoleEntity::getRoleId)
                .toList();
    }

    private List<String> findPermissionCodeIds(String roleId) {
        return rolePermissionMapper.selectList(Wrappers.<RolePermissionEntity>lambdaQuery()
                        .eq(RolePermissionEntity::getRoleId, roleId))
                .stream()
                .map(RolePermissionEntity::getPermissionCodeId)
                .toList();
    }

    private List<String> findScopeIds(String roleId) {
        return roleScopeMapper.selectList(Wrappers.<RoleScopeEntity>lambdaQuery()
                        .eq(RoleScopeEntity::getRoleId, roleId))
                .stream()
                .map(RoleScopeEntity::getScopeId)
                .toList();
    }

    private List<String> findResourceIds(String roleId) {
        return roleResourceMapper.selectList(Wrappers.<RoleResourceEntity>lambdaQuery()
                        .eq(RoleResourceEntity::getRoleId, roleId))
                .stream()
                .map(RoleResourceEntity::getResourceId)
                .toList();
    }

    private void validateRoles(String applicationId, List<String> roleIds) {
        Map<String, RoleEntity> roleMap = listRoles(applicationId).stream()
                .collect(Collectors.toMap(RoleEntity::getId, role -> role));
        boolean invalid = roleIds.stream().anyMatch(roleId -> !roleMap.containsKey(roleId));
        if (invalid) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "Role does not belong to application");
        }
    }
}
