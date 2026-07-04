package com.aegisid.admin.app.application.service;

import com.aegisid.admin.app.domain.model.Application;
import com.aegisid.admin.app.infrastructure.persistence.entity.RoleEntity;
import com.aegisid.admin.app.infrastructure.persistence.entity.UserEntity;
import com.aegisid.admin.app.infrastructure.persistence.entity.UserRoleEntity;
import com.aegisid.admin.app.infrastructure.persistence.mapper.RoleMapper;
import com.aegisid.admin.app.infrastructure.persistence.mapper.UserMapper;
import com.aegisid.admin.app.infrastructure.persistence.mapper.UserRoleMapper;
import com.aegisid.admin.app.interfaces.request.CreateUserRequest;
import com.aegisid.admin.app.interfaces.request.UpdateUserRequest;
import com.aegisid.admin.app.interfaces.response.RoleResponse;
import com.aegisid.admin.app.interfaces.response.UserApplicationAuthorizationResponse;
import com.aegisid.admin.app.interfaces.response.UserDetailResponse;
import com.aegisid.admin.app.interfaces.response.UserResponse;
import com.aegisid.common.api.ErrorCode;
import com.aegisid.common.domain.RecordStatus;
import com.aegisid.common.exception.BusinessException;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class UserManagementService {
    private final ApplicationManagementService applicationManagementService;
    private final DepartmentManagementService departmentManagementService;
    private final UserMapper userMapper;
    private final RoleMapper roleMapper;
    private final UserRoleMapper userRoleMapper;

    public UserManagementService(
            ApplicationManagementService applicationManagementService,
            DepartmentManagementService departmentManagementService,
            UserMapper userMapper,
            RoleMapper roleMapper,
            UserRoleMapper userRoleMapper
    ) {
        this.applicationManagementService = applicationManagementService;
        this.departmentManagementService = departmentManagementService;
        this.userMapper = userMapper;
        this.roleMapper = roleMapper;
        this.userRoleMapper = userRoleMapper;
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
        user.setDepartmentId(normalizeDepartmentId(request.departmentId()));
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
        user.setDepartmentId(normalizeDepartmentId(request.departmentId()));
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

    List<UserEntity> listUserEntities() {
        return userMapper.selectList(Wrappers.<UserEntity>lambdaQuery()
                .orderByAsc(UserEntity::getDisplayName));
    }

    UserEntity getUserEntity(String userId) {
        UserEntity user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "User not found");
        }
        return user;
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

    private List<RoleEntity> listRoles(String applicationId) {
        return roleMapper.selectList(Wrappers.<RoleEntity>lambdaQuery()
                .eq(RoleEntity::getApplicationId, applicationId)
                .orderByAsc(RoleEntity::getRoleCode));
    }

    private UserResponse updateUserStatus(String userId, String status) {
        UserEntity user = getUserEntity(userId);
        user.setStatus(status);
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.updateById(user);
        return UserResponse.from(user);
    }

    private String normalizeDepartmentId(String departmentId) {
        if (!StringUtils.hasText(departmentId)) {
            return null;
        }
        departmentManagementService.getDepartmentEntity(departmentId);
        return departmentId;
    }

    private String newId() {
        return UUID.randomUUID().toString().replace("-", "");
    }
}
