package com.aegisid.admin.app.application.service;

import com.aegisid.admin.app.infrastructure.persistence.entity.PermissionCodeEntity;
import com.aegisid.admin.app.infrastructure.persistence.entity.RoleEntity;
import com.aegisid.admin.app.infrastructure.persistence.entity.RolePermissionEntity;
import com.aegisid.admin.app.infrastructure.persistence.entity.RoleResourceEntity;
import com.aegisid.admin.app.infrastructure.persistence.entity.RoleScopeEntity;
import com.aegisid.admin.app.infrastructure.persistence.entity.ResourceEntity;
import com.aegisid.admin.app.infrastructure.persistence.entity.ScopeEntity;
import com.aegisid.admin.app.infrastructure.persistence.mapper.PermissionCodeMapper;
import com.aegisid.admin.app.infrastructure.persistence.mapper.ResourceMapper;
import com.aegisid.admin.app.infrastructure.persistence.mapper.RoleMapper;
import com.aegisid.admin.app.infrastructure.persistence.mapper.RolePermissionMapper;
import com.aegisid.admin.app.infrastructure.persistence.mapper.RoleResourceMapper;
import com.aegisid.admin.app.infrastructure.persistence.mapper.RoleScopeMapper;
import com.aegisid.admin.app.infrastructure.persistence.mapper.ScopeMapper;
import com.aegisid.admin.app.interfaces.request.CreatePermissionCodeRequest;
import com.aegisid.admin.app.interfaces.request.CreateResourceRequest;
import com.aegisid.admin.app.interfaces.request.CreateRoleRequest;
import com.aegisid.admin.app.interfaces.request.CreateScopeRequest;
import com.aegisid.admin.app.interfaces.request.UpdateRoleGrantsRequest;
import com.aegisid.admin.app.interfaces.response.PermissionCodeResponse;
import com.aegisid.admin.app.interfaces.response.PermissionConfigResponse;
import com.aegisid.admin.app.interfaces.response.ResourceResponse;
import com.aegisid.admin.app.interfaces.response.RoleGrantResponse;
import com.aegisid.admin.app.interfaces.response.RoleResponse;
import com.aegisid.admin.app.interfaces.response.ScopeResponse;
import com.aegisid.common.api.ErrorCode;
import com.aegisid.common.domain.RecordStatus;
import com.aegisid.common.exception.BusinessException;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ApplicationPermissionService {
    private static final String APPLICATION_ROLE_TYPE = "application";

    private final ApplicationManagementService applicationManagementService;
    private final RoleMapper roleMapper;
    private final PermissionCodeMapper permissionCodeMapper;
    private final ScopeMapper scopeMapper;
    private final ResourceMapper resourceMapper;
    private final RolePermissionMapper rolePermissionMapper;
    private final RoleScopeMapper roleScopeMapper;
    private final RoleResourceMapper roleResourceMapper;

    public ApplicationPermissionService(
            ApplicationManagementService applicationManagementService,
            RoleMapper roleMapper,
            PermissionCodeMapper permissionCodeMapper,
            ScopeMapper scopeMapper,
            ResourceMapper resourceMapper,
            RolePermissionMapper rolePermissionMapper,
            RoleScopeMapper roleScopeMapper,
            RoleResourceMapper roleResourceMapper
    ) {
        this.applicationManagementService = applicationManagementService;
        this.roleMapper = roleMapper;
        this.permissionCodeMapper = permissionCodeMapper;
        this.scopeMapper = scopeMapper;
        this.resourceMapper = resourceMapper;
        this.rolePermissionMapper = rolePermissionMapper;
        this.roleScopeMapper = roleScopeMapper;
        this.roleResourceMapper = roleResourceMapper;
    }

    public PermissionConfigResponse getConfig(String applicationId) {
        applicationManagementService.get(applicationId);
        List<RoleEntity> roles = listRoles(applicationId);
        List<PermissionCodeEntity> permissionCodes = listPermissionCodes(applicationId);
        List<ScopeEntity> scopes = listScopes(applicationId);
        List<ResourceEntity> resources = listResources(applicationId);
        List<RoleGrantResponse> grants = roles.stream()
                .map(role -> new RoleGrantResponse(
                        role.getId(),
                        findPermissionCodeIds(role.getId()),
                        findScopeIds(role.getId()),
                        findResourceIds(role.getId())
                ))
                .toList();
        return new PermissionConfigResponse(
                roles.stream().map(RoleResponse::from).toList(),
                permissionCodes.stream().map(PermissionCodeResponse::from).toList(),
                scopes.stream().map(ScopeResponse::from).toList(),
                resources.stream().map(ResourceResponse::from).toList(),
                grants
        );
    }

    @Transactional
    public RoleResponse createRole(String applicationId, CreateRoleRequest request) {
        applicationManagementService.get(applicationId);
        ensureRoleCodeNotExists(applicationId, request.roleCode());
        LocalDateTime now = LocalDateTime.now();
        RoleEntity role = new RoleEntity();
        role.setId(newId());
        role.setApplicationId(applicationId);
        role.setRoleCode(request.roleCode());
        role.setRoleName(request.roleName());
        role.setRoleType(APPLICATION_ROLE_TYPE);
        role.setStatus(RecordStatus.ACTIVE);
        role.setCreatedAt(now);
        role.setUpdatedAt(now);
        roleMapper.insert(role);
        return RoleResponse.from(role);
    }

    @Transactional
    public PermissionCodeResponse createPermissionCode(String applicationId, CreatePermissionCodeRequest request) {
        applicationManagementService.get(applicationId);
        ensurePermissionCodeNotExists(applicationId, request.permissionCode());
        LocalDateTime now = LocalDateTime.now();
        PermissionCodeEntity permissionCode = new PermissionCodeEntity();
        permissionCode.setId(newId());
        permissionCode.setApplicationId(applicationId);
        permissionCode.setPermissionCode(request.permissionCode());
        permissionCode.setPermissionName(request.permissionName());
        permissionCode.setDescription(request.description());
        permissionCode.setStatus(RecordStatus.ACTIVE);
        permissionCode.setCreatedAt(now);
        permissionCode.setUpdatedAt(now);
        permissionCodeMapper.insert(permissionCode);
        return PermissionCodeResponse.from(permissionCode);
    }

    @Transactional
    public ScopeResponse createScope(String applicationId, CreateScopeRequest request) {
        applicationManagementService.get(applicationId);
        ensureScopeCodeNotExists(applicationId, request.scopeCode());
        LocalDateTime now = LocalDateTime.now();
        ScopeEntity scope = new ScopeEntity();
        scope.setId(newId());
        scope.setApplicationId(applicationId);
        scope.setScopeCode(request.scopeCode());
        scope.setScopeName(request.scopeName());
        scope.setDescription(request.description());
        scope.setStatus(RecordStatus.ACTIVE);
        scope.setCreatedAt(now);
        scope.setUpdatedAt(now);
        scopeMapper.insert(scope);
        return ScopeResponse.from(scope);
    }

    @Transactional
    public ResourceResponse createResource(String applicationId, CreateResourceRequest request) {
        applicationManagementService.get(applicationId);
        ensureResourceCodeNotExists(applicationId, request.resourceCode());
        validateParentResource(applicationId, request.parentId());
        LocalDateTime now = LocalDateTime.now();
        ResourceEntity resource = new ResourceEntity();
        resource.setId(newId());
        resource.setApplicationId(applicationId);
        resource.setParentId(blankToNull(request.parentId()));
        resource.setResourceCode(request.resourceCode());
        resource.setResourceName(request.resourceName());
        resource.setResourceType(request.resourceType());
        resource.setPath(request.path());
        resource.setHttpMethod(request.httpMethod());
        resource.setUrlPattern(request.urlPattern());
        resource.setSortOrder(0);
        resource.setVisible(true);
        resource.setStatus(RecordStatus.ACTIVE);
        resource.setCreatedAt(now);
        resource.setUpdatedAt(now);
        resourceMapper.insert(resource);
        return ResourceResponse.from(resource);
    }

    @Transactional
    public RoleGrantResponse updateRoleGrants(String roleId, UpdateRoleGrantsRequest request) {
        RoleEntity role = roleMapper.selectById(roleId);
        if (role == null) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Role not found");
        }
        List<String> permissionCodeIds = request.permissionCodeIds() == null ? List.of() : request.permissionCodeIds();
        List<String> scopeIds = request.scopeIds() == null ? List.of() : request.scopeIds();
        List<String> resourceIds = request.resourceIds() == null ? List.of() : request.resourceIds();
        validatePermissionCodes(role.getApplicationId(), permissionCodeIds);
        validateScopes(role.getApplicationId(), scopeIds);
        validateResources(role.getApplicationId(), resourceIds);
        rolePermissionMapper.delete(Wrappers.<RolePermissionEntity>lambdaQuery()
                .eq(RolePermissionEntity::getRoleId, roleId));
        roleScopeMapper.delete(Wrappers.<RoleScopeEntity>lambdaQuery()
                .eq(RoleScopeEntity::getRoleId, roleId));
        roleResourceMapper.delete(Wrappers.<RoleResourceEntity>lambdaQuery()
                .eq(RoleResourceEntity::getRoleId, roleId));
        LocalDateTime now = LocalDateTime.now();
        permissionCodeIds.forEach(permissionCodeId -> {
            RolePermissionEntity entity = new RolePermissionEntity();
            entity.setRoleId(roleId);
            entity.setPermissionCodeId(permissionCodeId);
            entity.setCreatedAt(now);
            rolePermissionMapper.insert(entity);
        });
        scopeIds.forEach(scopeId -> {
            RoleScopeEntity entity = new RoleScopeEntity();
            entity.setRoleId(roleId);
            entity.setScopeId(scopeId);
            entity.setCreatedAt(now);
            roleScopeMapper.insert(entity);
        });
        resourceIds.forEach(resourceId -> {
            RoleResourceEntity entity = new RoleResourceEntity();
            entity.setRoleId(roleId);
            entity.setResourceId(resourceId);
            entity.setEffect("allow");
            entity.setCreatedAt(now);
            roleResourceMapper.insert(entity);
        });
        return new RoleGrantResponse(roleId, permissionCodeIds, scopeIds, resourceIds);
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
                .orderByAsc(ResourceEntity::getResourceType)
                .orderByAsc(ResourceEntity::getResourceCode));
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

    private void validatePermissionCodes(String applicationId, List<String> permissionCodeIds) {
        Map<String, PermissionCodeEntity> permissionCodeMap = listPermissionCodes(applicationId)
                .stream()
                .collect(Collectors.toMap(PermissionCodeEntity::getId, permissionCode -> permissionCode));
        boolean invalid = permissionCodeIds.stream().anyMatch(permissionCodeId -> !permissionCodeMap.containsKey(permissionCodeId));
        if (invalid) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "Permission code does not belong to application");
        }
    }

    private void validateScopes(String applicationId, List<String> scopeIds) {
        Map<String, ScopeEntity> scopeMap = listScopes(applicationId)
                .stream()
                .collect(Collectors.toMap(ScopeEntity::getId, scope -> scope));
        boolean invalid = scopeIds.stream().anyMatch(scopeId -> !scopeMap.containsKey(scopeId));
        if (invalid) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "Scope does not belong to application");
        }
    }

    private void validateResources(String applicationId, List<String> resourceIds) {
        Map<String, ResourceEntity> resourceMap = listResources(applicationId)
                .stream()
                .collect(Collectors.toMap(ResourceEntity::getId, resource -> resource));
        boolean invalid = resourceIds.stream().anyMatch(resourceId -> !resourceMap.containsKey(resourceId));
        if (invalid) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "Resource does not belong to application");
        }
    }

    private void validateParentResource(String applicationId, String parentId) {
        if (parentId == null || parentId.isBlank()) {
            return;
        }
        ResourceEntity parent = resourceMapper.selectById(parentId);
        if (parent == null || !applicationId.equals(parent.getApplicationId())) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "Parent resource does not belong to application");
        }
    }

    private void ensureRoleCodeNotExists(String applicationId, String roleCode) {
        Long count = roleMapper.selectCount(Wrappers.<RoleEntity>lambdaQuery()
                .eq(RoleEntity::getApplicationId, applicationId)
                .eq(RoleEntity::getRoleCode, roleCode));
        if (count > 0) {
            throw new BusinessException(ErrorCode.RESOURCE_CONFLICT, "Role code already exists");
        }
    }

    private void ensurePermissionCodeNotExists(String applicationId, String permissionCode) {
        Long count = permissionCodeMapper.selectCount(Wrappers.<PermissionCodeEntity>lambdaQuery()
                .eq(PermissionCodeEntity::getApplicationId, applicationId)
                .eq(PermissionCodeEntity::getPermissionCode, permissionCode));
        if (count > 0) {
            throw new BusinessException(ErrorCode.RESOURCE_CONFLICT, "Permission code already exists");
        }
    }

    private void ensureScopeCodeNotExists(String applicationId, String scopeCode) {
        Long count = scopeMapper.selectCount(Wrappers.<ScopeEntity>lambdaQuery()
                .eq(ScopeEntity::getApplicationId, applicationId)
                .eq(ScopeEntity::getScopeCode, scopeCode));
        if (count > 0) {
            throw new BusinessException(ErrorCode.RESOURCE_CONFLICT, "Scope already exists");
        }
    }

    private void ensureResourceCodeNotExists(String applicationId, String resourceCode) {
        Long count = resourceMapper.selectCount(Wrappers.<ResourceEntity>lambdaQuery()
                .eq(ResourceEntity::getApplicationId, applicationId)
                .eq(ResourceEntity::getResourceCode, resourceCode));
        if (count > 0) {
            throw new BusinessException(ErrorCode.RESOURCE_CONFLICT, "Resource code already exists");
        }
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private String newId() {
        return UUID.randomUUID().toString().replace("-", "");
    }
}
