package com.bika.archive.dto.request;

import java.util.UUID;

public record UpdateDocumentLocationRequest(
        UUID boxLocationId
) {
}
