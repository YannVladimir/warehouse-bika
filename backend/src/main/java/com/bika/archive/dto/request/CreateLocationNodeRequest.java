package com.bika.archive.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CreateLocationNodeRequest(
        @NotNull UUID warehouseId,
        UUID parentId,
        @NotBlank String nodeType,
        @NotBlank String name,
        String description,
        Integer capacity,
        boolean storageUnit
) {
}
