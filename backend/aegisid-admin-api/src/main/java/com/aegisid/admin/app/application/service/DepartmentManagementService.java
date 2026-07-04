package com.aegisid.admin.app.application.service;

import com.aegisid.admin.app.infrastructure.persistence.entity.DepartmentEntity;
import com.aegisid.admin.app.infrastructure.persistence.mapper.DepartmentMapper;
import com.aegisid.admin.app.interfaces.request.CreateDepartmentRequest;
import com.aegisid.admin.app.interfaces.request.UpdateDepartmentRequest;
import com.aegisid.admin.app.interfaces.response.DepartmentResponse;
import com.aegisid.common.api.ErrorCode;
import com.aegisid.common.domain.RecordStatus;
import com.aegisid.common.exception.BusinessException;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class DepartmentManagementService {
    private final DepartmentMapper departmentMapper;

    public DepartmentManagementService(DepartmentMapper departmentMapper) {
        this.departmentMapper = departmentMapper;
    }

    public List<DepartmentResponse> listDepartments() {
        return departmentMapper.selectList(Wrappers.<DepartmentEntity>lambdaQuery()
                        .orderByAsc(DepartmentEntity::getSortOrder)
                        .orderByAsc(DepartmentEntity::getCode))
                .stream()
                .map(DepartmentResponse::from)
                .toList();
    }

    @Transactional
    public DepartmentResponse createDepartment(CreateDepartmentRequest request) {
        DepartmentEntity parent = getParent(request.parentId());
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
        assertCodeAvailable(request.code(), departmentId);

        department.setParentId(parentId);
        department.setName(request.name());
        department.setCode(request.code());
        department.setSortOrder(defaultSortOrder(request.sortOrder()));
        department.setPath(buildPath(parent, department.getId()));
        department.setUpdatedAt(LocalDateTime.now());
        departmentMapper.updateById(department);
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

    DepartmentEntity getDepartmentEntity(String departmentId) {
        DepartmentEntity department = departmentMapper.selectById(departmentId);
        if (department == null) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Department not found");
        }
        return department;
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
