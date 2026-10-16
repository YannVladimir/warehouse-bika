package com.bika.archive.dto.request;

import jakarta.validation.constraints.NotBlank;

public record CreateWarehouseRequest(
        @NotBlank String name,
        String address,
        String city,
        String managerName
) {
}
