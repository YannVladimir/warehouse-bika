package com.bika.archive.dto.request;

import jakarta.validation.constraints.NotBlank;

public record UpdateWarehouseRequest(
        @NotBlank String name,
        String address,
        String city,
        String managerName,
        boolean active
) {
}
