package com.aegisid.admin.app.application.service;

import com.aegisid.admin.app.infrastructure.persistence.entity.AuditEventEntity;
import com.aegisid.admin.app.infrastructure.persistence.mapper.AuditEventMapper;
import com.aegisid.admin.app.interfaces.response.AuditEventResponse;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class AuditEventService {
    private static final int DEFAULT_LIMIT = 100;
    private static final int MAX_LIMIT = 500;

    private final AuditEventMapper auditEventMapper;

    public AuditEventService(AuditEventMapper auditEventMapper) {
        this.auditEventMapper = auditEventMapper;
    }

    public void recordSuccess(
            String eventType,
            String targetType,
            String targetId,
            String detailJson
    ) {
        AuditEventEntity event = new AuditEventEntity();
        event.setId(newId());
        event.setEventType(eventType);
        event.setTargetType(targetType);
        event.setTargetId(targetId);
        event.setResult("success");
        event.setDetailJson(detailJson);
        event.setCreatedAt(LocalDateTime.now());
        auditEventMapper.insert(event);
    }

    public List<AuditEventResponse> listEvents(String eventType, String targetType, Integer limit) {
        int actualLimit = normalizeLimit(limit);
        return auditEventMapper.selectList(Wrappers.<AuditEventEntity>lambdaQuery()
                        .eq(StringUtils.hasText(eventType), AuditEventEntity::getEventType, eventType)
                        .eq(StringUtils.hasText(targetType), AuditEventEntity::getTargetType, targetType)
                        .orderByDesc(AuditEventEntity::getCreatedAt)
                        .last("limit " + actualLimit))
                .stream()
                .map(AuditEventResponse::from)
                .toList();
    }

    public String detail(Map<String, ?> detail) {
        StringBuilder builder = new StringBuilder("{");
        int index = 0;
        for (Map.Entry<String, ?> entry : detail.entrySet()) {
            if (index > 0) {
                builder.append(',');
            }
            builder.append('"').append(escape(entry.getKey())).append('"').append(':');
            Object value = entry.getValue();
            if (value == null) {
                builder.append("null");
            } else {
                builder.append('"').append(escape(String.valueOf(value))).append('"');
            }
            index++;
        }
        return builder.append('}').toString();
    }

    private int normalizeLimit(Integer limit) {
        if (limit == null || limit <= 0) {
            return DEFAULT_LIMIT;
        }
        return Math.min(limit, MAX_LIMIT);
    }

    private String escape(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private String newId() {
        return UUID.randomUUID().toString().replace("-", "");
    }
}
