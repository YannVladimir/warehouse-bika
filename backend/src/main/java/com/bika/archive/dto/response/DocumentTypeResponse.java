package com.bika.archive.dto.response;

import java.time.Instant;
import java.util.UUID;

public record DocumentTypeResponse(
        UUID id,
        UUID companyId,
        String name,
        String description,
        Instant createdAt
) {
}
