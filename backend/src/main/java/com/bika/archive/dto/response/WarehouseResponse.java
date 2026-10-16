package com.bika.archive.dto.response;

import java.time.Instant;
import java.util.UUID;

public record WarehouseResponse(
        UUID id,
        UUID companyId,
        String companyName,
        String name,
        String address,
        String city,
        String managerName,
        boolean active,
        Instant createdAt
) {
}
