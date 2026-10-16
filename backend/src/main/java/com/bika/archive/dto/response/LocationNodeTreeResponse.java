package com.bika.archive.dto.response;

import java.util.List;
import java.util.UUID;

public record LocationNodeTreeResponse(
        UUID id,
        String nodeType,
        String name,
        String description,
        Integer capacity,
        boolean storageUnit,
        List<LocationNodeTreeResponse> children
) {
}
