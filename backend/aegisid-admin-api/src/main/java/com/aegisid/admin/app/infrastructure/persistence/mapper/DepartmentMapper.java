package com.aegisid.admin.app.infrastructure.persistence.mapper;

import com.aegisid.admin.app.infrastructure.persistence.entity.DepartmentEntity;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface DepartmentMapper extends BaseMapper<DepartmentEntity> {
}
