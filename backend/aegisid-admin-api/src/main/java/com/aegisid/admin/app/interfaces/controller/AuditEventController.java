package com.aegisid.admin.app.interfaces.controller;

import com.aegisid.admin.app.application.service.AuditEventService;
import com.aegisid.admin.app.interfaces.response.AuditEventResponse;
import com.aegisid.common.api.ApiResponse;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/audit-events")
public class AuditEventController {
    private final AuditEventService auditEventService;

    public AuditEventController(AuditEventService auditEventService) {
        this.auditEventService = auditEventService;
    }

    @GetMapping
    ApiResponse<List<AuditEventResponse>> list(
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) String targetType,
            @RequestParam(required = false) Integer limit
    ) {
        return ApiResponse.ok(auditEventService.listEvents(eventType, targetType, limit));
    }
}
