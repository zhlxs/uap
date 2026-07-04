package com.aegisid.admin.app.application.service;

import com.aegisid.admin.app.infrastructure.persistence.entity.RoleEntity;
import com.aegisid.admin.app.infrastructure.persistence.entity.UserEntity;
import com.aegisid.admin.app.infrastructure.persistence.entity.UserRoleEntity;
import com.aegisid.admin.app.infrastructure.persistence.mapper.RoleMapper;
import com.aegisid.admin.app.infrastructure.persistence.mapper.UserMapper;
import com.aegisid.admin.app.infrastructure.persistence.mapper.UserRoleMapper;
import com.aegisid.admin.app.interfaces.request.CreateUserRequest;
import com.aegisid.admin.app.interfaces.request.UpdateUserRolesRequest;
import com.aegisid.admin.app.interfaces.response.MemberAuthorizationResponse;
import com.aegisid.admin.app.interfaces.response.RoleResponse;
import com.aegisid.admin.app.interfaces.response.UserResponse;
import com.aegisid.admin.app.interfaces.response.UserRoleAssignmentResponse;
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
public class MemberAuthorizationService {
    private final ApplicationManagementService applicationManagementService;
    private final UserMapper userMapper;
    private final RoleMapper roleMapper;
    private final UserRoleMapper userRoleMapper;

    public MemberAuthorizationService(
            ApplicationManagementService applicationManagementService,
            UserMapper userMapper,
            RoleMapper roleMapper,
            UserRoleMapper userRoleMapper
    ) {
        this.applicationManagementService = applicationManagementService;
        this.userMapper = userMapper;
        this.roleMapper = roleMapper;
        this.userRoleMapper = userRoleMapper;
    }

    public MemberAuthorizationResponse getConfig(String applicationId) {
        applicationManagementService.get(applicationId);
        List<UserEntity> users = listUsers();
        List<RoleEntity> roles = listRoles(applicationId);
        List<UserRoleAssignmentResponse> assignments = users.stream()
                .map(user -> new UserRoleAssignmentResponse(user.getId(), findRoleIds(applicationId, user.getId())))
                .toList();
        return new MemberAuthorizationResponse(
                users.stream().map(UserResponse::from).toList(),
                roles.stream().map(RoleResponse::from).toList(),
                assignments
        );
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

    private List<UserEntity> listUsers() {
        return userMapper.selectList(Wrappers.<UserEntity>lambdaQuery()
                .orderByAsc(UserEntity::getDisplayName));
    }

    private List<RoleEntity> listRoles(String applicationId) {
        return roleMapper.selectList(Wrappers.<RoleEntity>lambdaQuery()
                .eq(RoleEntity::getApplicationId, applicationId)
                .orderByAsc(RoleEntity::getRoleCode));
    }

    private List<String> findRoleIds(String applicationId, String userId) {
        return userRoleMapper.selectList(Wrappers.<UserRoleEntity>lambdaQuery()
                        .eq(UserRoleEntity::getApplicationId, applicationId)
                        .eq(UserRoleEntity::getUserId, userId))
                .stream()
                .map(UserRoleEntity::getRoleId)
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

    private String newId() {
        return UUID.randomUUID().toString().replace("-", "");
    }
}
