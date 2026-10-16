package com.bika.archive.dto.response;

import java.time.Instant;
import java.util.UUID;

public record CompanyResponse(
        UUID id,
        String name,
        String email,
        String phone,
        String industry,
        boolean active,
        Instant createdAt
) {
}
