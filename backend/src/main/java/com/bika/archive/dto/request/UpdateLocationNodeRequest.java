package com.bika.archive.dto.request;

import jakarta.validation.constraints.NotBlank;

public record UpdateLocationNodeRequest(
        @NotBlank String name,
        String description,
        Integer capacity
) {
}
