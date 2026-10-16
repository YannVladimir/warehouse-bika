package com.bika.archive.dto.response;

import java.time.Instant;
import java.util.UUID;

public record AuditLogResponse(
        UUID id,
        String actorEmail,
        String actorName,
        UUID companyId,
        String entityType,
        String entityId,
        String action,
        String oldValue,
        String newValue,
        String ipAddress,
        Instant createdAt
) {
}
