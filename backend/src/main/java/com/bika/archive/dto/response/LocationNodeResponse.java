package com.bika.archive.dto.response;

import java.time.Instant;
import java.util.UUID;

public record LocationNodeResponse(
        UUID id,
        UUID warehouseId,
        UUID parentId,
        String nodeType,
        String name,
        String description,
        Integer capacity,
        boolean storageUnit,
        Instant createdAt
) {
}
