package com.bika.archive.dto.response;

import java.util.List;
import java.util.UUID;

public record LocationPathResponse(
        UUID warehouseId,
        String warehouseName,
        List<LocationPathSegment> segments
) {
}
