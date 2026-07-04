package com.aegisid.admin.app.infrastructure.persistence.mapper;

import com.aegisid.admin.app.infrastructure.persistence.entity.AuditEventEntity;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface AuditEventMapper extends BaseMapper<AuditEventEntity> {
}
