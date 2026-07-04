package com.aegisid.admin.app.application.service;

import com.aegisid.admin.app.infrastructure.persistence.entity.DepartmentEntity;
import com.aegisid.admin.app.infrastructure.persistence.entity.UserEntity;
import com.aegisid.admin.app.infrastructure.persistence.mapper.DepartmentMapper;
import com.aegisid.admin.app.infrastructure.persistence.mapper.UserMapper;
import com.aegisid.admin.app.interfaces.request.CreateDepartmentRequest;
import com.aegisid.admin.app.interfaces.request.UpdateDepartmentRequest;
import com.aegisid.admin.app.interfaces.response.DepartmentResponse;
import com.aegisid.admin.app.interfaces.response.DepartmentTreeResponse;
import com.aegisid.common.api.ErrorCode;
import com.aegisid.common.domain.RecordStatus;
import com.aegisid.common.exception.BusinessException;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class DepartmentManagementService {
    private final DepartmentMapper departmentMapper;
    private final UserMapper userMapper;

    public DepartmentManagementService(DepartmentMapper departmentMapper, UserMapper userMapper) {
        this.departmentMapper = departmentMapper;
        this.userMapper = userMapper;
    }

    public List<DepartmentResponse> listDepartments() {
        return listDepartmentEntities()
                .stream()
                .map(DepartmentResponse::from)
                .toList();
    }

    public List<DepartmentTreeResponse> departmentTree() {
        List<DepartmentEntity> departments = listDepartmentEntities();
        Map<String, List<DepartmentEntity>> childrenMap = new HashMap<>();
        for (DepartmentEntity department : departments) {
            childrenMap.computeIfAbsent(department.getParentId(), key -> new ArrayList<>()).add(department);
        }
        return childrenMap.getOrDefault(null, List.of())
                .stream()
                .map(department -> buildTreeNode(department, childrenMap))
                .toList();
    }

    @Transactional
    public DepartmentResponse createDepartment(CreateDepartmentRequest request) {
        DepartmentEntity parent = getParent(request.parentId());
        assertDepartmentActive(parent, "Parent department is disabled");
        assertCodeAvailable(request.code(), null);

        LocalDateTime now = LocalDateTime.now();
        DepartmentEntity department = new DepartmentEntity();
        department.setId(newId());
        department.setParentId(normalizeBlank(request.parentId()));
        department.setName(request.name());
        department.setCode(request.code());
        department.setSortOrder(defaultSortOrder(request.sortOrder()));
        department.setStatus(RecordStatus.ACTIVE);
        department.setCreatedAt(now);
        department.setUpdatedAt(now);
        department.setPath(buildPath(parent, department.getId()));
        departmentMapper.insert(department);
        return DepartmentResponse.from(department);
    }

    @Transactional
    public DepartmentResponse updateDepartment(String departmentId, UpdateDepartmentRequest request) {
        DepartmentEntity department = getDepartmentEntity(departmentId);
        String parentId = normalizeBlank(request.parentId());
        if (departmentId.equals(parentId)) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "Department parent cannot be itself");
        }
        DepartmentEntity parent = getParent(parentId);
        assertDepartmentActive(parent, "Parent department is disabled");
        assertParentMovable(department, parent);
        assertCodeAvailable(request.code(), departmentId);

        String oldPath = department.getPath();
        department.setParentId(parentId);
        department.setName(request.name());
        department.setCode(request.code());
        department.setSortOrder(defaultSortOrder(request.sortOrder()));
        department.setPath(buildPath(parent, department.getId()));
        department.setUpdatedAt(LocalDateTime.now());
        departmentMapper.updateById(department);
        syncChildrenPath(oldPath, department.getPath());
        return DepartmentResponse.from(department);
    }

    @Transactional
    public DepartmentResponse enableDepartment(String departmentId) {
        return updateDepartmentStatus(departmentId, RecordStatus.ACTIVE);
    }

    @Transactional
    public DepartmentResponse disableDepartment(String departmentId) {
        return updateDepartmentStatus(departmentId, RecordStatus.DISABLED);
    }

    @Transactional
    public void deleteDepartment(String departmentId) {
        getDepartmentEntity(departmentId);
        assertNoChildren(departmentId);
        assertNoUsers(departmentId);
        departmentMapper.deleteById(departmentId);
    }

    DepartmentEntity getDepartmentEntity(String departmentId) {
        DepartmentEntity department = departmentMapper.selectById(departmentId);
        if (department == null) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Department not found");
        }
        return department;
    }

    DepartmentEntity getActiveDepartmentEntity(String departmentId) {
        DepartmentEntity department = getDepartmentEntity(departmentId);
        assertDepartmentActive(department, "Department is disabled");
        return department;
    }

    List<String> collectDepartmentAndChildrenIds(String departmentId) {
        if (!StringUtils.hasText(departmentId)) {
            return List.of();
        }
        DepartmentEntity department = getDepartmentEntity(departmentId);
        String pathPrefix = department.getPath() + "/";
        List<String> ids = new ArrayList<>();
        ids.add(department.getId());
        departmentMapper.selectList(Wrappers.<DepartmentEntity>lambdaQuery()
                        .likeRight(DepartmentEntity::getPath, pathPrefix)
                        .orderByAsc(DepartmentEntity::getSortOrder)
                        .orderByAsc(DepartmentEntity::getCode))
                .forEach(child -> ids.add(child.getId()));
        return ids;
    }

    private List<DepartmentEntity> listDepartmentEntities() {
        return departmentMapper.selectList(Wrappers.<DepartmentEntity>lambdaQuery()
                .orderByAsc(DepartmentEntity::getSortOrder)
                .orderByAsc(DepartmentEntity::getCode));
    }

    private DepartmentTreeResponse buildTreeNode(
            DepartmentEntity department,
            Map<String, List<DepartmentEntity>> childrenMap
    ) {
        List<DepartmentTreeResponse> children = childrenMap.getOrDefault(department.getId(), List.of())
                .stream()
                .sorted(Comparator
                        .comparing(DepartmentEntity::getSortOrder, Comparator.nullsLast(Integer::compareTo))
                        .thenComparing(DepartmentEntity::getCode, Comparator.nullsLast(String::compareTo)))
                .map(child -> buildTreeNode(child, childrenMap))
                .toList();
        return DepartmentTreeResponse.from(department, children);
    }

    private DepartmentResponse updateDepartmentStatus(String departmentId, String status) {
        DepartmentEntity department = getDepartmentEntity(departmentId);
        department.setStatus(status);
        department.setUpdatedAt(LocalDateTime.now());
        departmentMapper.updateById(department);
        return DepartmentResponse.from(department);
    }

    private DepartmentEntity getParent(String parentId) {
        if (!StringUtils.hasText(parentId)) {
            return null;
        }
        return getDepartmentEntity(parentId);
    }

    private void assertCodeAvailable(String code, String excludeId) {
        Long count = departmentMapper.selectCount(Wrappers.<DepartmentEntity>lambdaQuery()
                .eq(DepartmentEntity::getCode, code)
                .ne(StringUtils.hasText(excludeId), DepartmentEntity::getId, excludeId));
        if (count != null && count > 0) {
            throw new BusinessException(ErrorCode.RESOURCE_CONFLICT, "Department code already exists");
        }
    }

    private void assertDepartmentActive(DepartmentEntity department, String message) {
        if (department != null && !RecordStatus.ACTIVE.equals(department.getStatus())) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, message);
        }
    }

    private void assertNoChildren(String departmentId) {
        Long count = departmentMapper.selectCount(Wrappers.<DepartmentEntity>lambdaQuery()
                .eq(DepartmentEntity::getParentId, departmentId));
        if (count != null && count > 0) {
            throw new BusinessException(ErrorCode.RESOURCE_CONFLICT, "Department has child departments");
        }
    }

    private void assertNoUsers(String departmentId) {
        Long count = userMapper.selectCount(Wrappers.<UserEntity>lambdaQuery()
                .eq(UserEntity::getDepartmentId, departmentId));
        if (count != null && count > 0) {
            throw new BusinessException(ErrorCode.RESOURCE_CONFLICT, "Department has assigned users");
        }
    }

    private void assertParentMovable(DepartmentEntity department, DepartmentEntity parent) {
        if (parent == null) {
            return;
        }
        String childPath = parent.getPath();
        if (StringUtils.hasText(childPath) && childPath.startsWith(department.getPath() + "/")) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "Department cannot move under its child");
        }
    }

    private void syncChildrenPath(String oldPath, String newPath) {
        if (!StringUtils.hasText(oldPath) || oldPath.equals(newPath)) {
            return;
        }
        List<DepartmentEntity> children = departmentMapper.selectList(Wrappers.<DepartmentEntity>lambdaQuery()
                .likeRight(DepartmentEntity::getPath, oldPath + "/"));
        LocalDateTime now = LocalDateTime.now();
        for (DepartmentEntity child : children) {
            child.setPath(newPath + child.getPath().substring(oldPath.length()));
            child.setUpdatedAt(now);
            departmentMapper.updateById(child);
        }
    }

    private String buildPath(DepartmentEntity parent, String departmentId) {
        if (parent == null || !StringUtils.hasText(parent.getPath())) {
            return "/" + departmentId;
        }
        return parent.getPath() + "/" + departmentId;
    }

    private Integer defaultSortOrder(Integer sortOrder) {
        return sortOrder == null ? 0 : sortOrder;
    }

    private String normalizeBlank(String value) {
        return StringUtils.hasText(value) ? value : null;
    }

    private String newId() {
        return UUID.randomUUID().toString().replace("-", "");
    }
}
