package com.aegisid.admin.app.interfaces.response;

import com.aegisid.admin.app.infrastructure.persistence.entity.AuditEventEntity;
import java.time.LocalDateTime;

public record AuditEventResponse(
        String id,
        String eventType,
        String actorUserId,
        String targetType,
        String targetId,
        String result,
        String errorCode,
        String detailJson,
        LocalDateTime createdAt
) {
    public static AuditEventResponse from(AuditEventEntity event) {
        return new AuditEventResponse(
                event.getId(),
                event.getEventType(),
                event.getActorUserId(),
                event.getTargetType(),
                event.getTargetId(),
                event.getResult(),
                event.getErrorCode(),
                event.getDetailJson(),
                event.getCreatedAt()
        );
    }
}
