package com.aegisid.admin.app.application.service;

import com.aegisid.admin.app.domain.model.Application;
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
import com.aegisid.admin.app.infrastructure.persistence.mapper.UserMapper;
import com.aegisid.admin.app.infrastructure.persistence.mapper.UserRoleMapper;
import com.aegisid.admin.app.interfaces.request.CreateUserRequest;
import com.aegisid.admin.app.interfaces.request.UpdateUserRequest;
import com.aegisid.admin.app.interfaces.request.UpdateUserRolesRequest;
import com.aegisid.admin.app.interfaces.response.MemberAuthorizationResponse;
import com.aegisid.admin.app.interfaces.response.MemberRoleGrantResponse;
import com.aegisid.admin.app.interfaces.response.PermissionCodeResponse;
import com.aegisid.admin.app.interfaces.response.ResourceResponse;
import com.aegisid.admin.app.interfaces.response.RoleResponse;
import com.aegisid.admin.app.interfaces.response.ScopeResponse;
import com.aegisid.admin.app.interfaces.response.UserApplicationAuthorizationResponse;
import com.aegisid.admin.app.interfaces.response.UserDetailResponse;
import com.aegisid.admin.app.interfaces.response.UserResponse;
import com.aegisid.admin.app.interfaces.response.UserRoleAssignmentResponse;
import com.aegisid.common.api.ErrorCode;
import com.aegisid.common.domain.RecordStatus;
import com.aegisid.common.exception.BusinessException;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MemberAuthorizationService {
    private final ApplicationManagementService applicationManagementService;
    private final UserMapper userMapper;
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
            UserMapper userMapper,
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
        this.userMapper = userMapper;
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
        List<UserEntity> users = listUserEntities();
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

    public List<UserResponse> listUsers() {
        return listUserEntities().stream().map(UserResponse::from).toList();
    }

    public UserDetailResponse getUser(String userId) {
        UserEntity user = getUserEntity(userId);
        List<UserRoleEntity> assignments = userRoleMapper.selectList(Wrappers.<UserRoleEntity>lambdaQuery()
                .eq(UserRoleEntity::getUserId, userId));
        Set<String> applicationIds = assignments.stream()
                .map(UserRoleEntity::getApplicationId)
                .collect(Collectors.toSet());
        List<UserApplicationAuthorizationResponse> authorizations = applicationIds.stream()
                .map(applicationId -> buildAuthorization(applicationId, assignments))
                .toList();
        return new UserDetailResponse(UserResponse.from(user), authorizations);
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        LocalDateTime now = LocalDateTime.now();
        UserEntity user = new UserEntity();
        user.setId(newId());
        user.setDisplayName(request.displayName());
        user.setEmployeeNo(request.employeeNo());
        user.setEmail(request.email());
        user.setMobile(request.mobile());
        user.setUserType("employee");
        user.setStatus(RecordStatus.ACTIVE);
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        userMapper.insert(user);
        return UserResponse.from(user);
    }

    @Transactional
    public UserResponse updateUser(String userId, UpdateUserRequest request) {
        UserEntity user = getUserEntity(userId);
        user.setDisplayName(request.displayName());
        user.setEmployeeNo(request.employeeNo());
        user.setEmail(request.email());
        user.setMobile(request.mobile());
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.updateById(user);
        return UserResponse.from(user);
    }

    @Transactional
    public UserResponse enableUser(String userId) {
        return updateUserStatus(userId, RecordStatus.ACTIVE);
    }

    @Transactional
    public UserResponse disableUser(String userId) {
        return updateUserStatus(userId, RecordStatus.DISABLED);
    }

    @Transactional
    public UserResponse lockUser(String userId) {
        return updateUserStatus(userId, RecordStatus.LOCKED);
    }

    @Transactional
    public UserRoleAssignmentResponse updateUserRoles(
            String applicationId,
            String userId,
            UpdateUserRolesRequest request
    ) {
        applicationManagementService.get(applicationId);
        UserEntity user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "User not found");
        }
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
        return new UserRoleAssignmentResponse(userId, roleIds);
    }

    private List<UserEntity> listUserEntities() {
        return userMapper.selectList(Wrappers.<UserEntity>lambdaQuery()
                .orderByAsc(UserEntity::getDisplayName));
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

    private UserApplicationAuthorizationResponse buildAuthorization(
            String applicationId,
            List<UserRoleEntity> assignments
    ) {
        Application application = applicationManagementService.get(applicationId);
        Set<String> assignedRoleIds = assignments.stream()
                .filter(assignment -> applicationId.equals(assignment.getApplicationId()))
                .map(UserRoleEntity::getRoleId)
                .collect(Collectors.toSet());
        List<RoleResponse> roles = listRoles(applicationId).stream()
                .filter(role -> assignedRoleIds.contains(role.getId()))
                .map(RoleResponse::from)
                .toList();
        return new UserApplicationAuthorizationResponse(
                application.id(),
                application.appCode(),
                application.appName(),
                application.appType(),
                application.protocol(),
                application.permissionMode(),
                application.status(),
                roles
        );
    }

    private UserEntity getUserEntity(String userId) {
        UserEntity user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "User not found");
        }
        return user;
    }

    private UserResponse updateUserStatus(String userId, String status) {
        UserEntity user = getUserEntity(userId);
        user.setStatus(status);
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.updateById(user);
        return UserResponse.from(user);
    }

    private String newId() {
        return UUID.randomUUID().toString().replace("-", "");
    }
}
