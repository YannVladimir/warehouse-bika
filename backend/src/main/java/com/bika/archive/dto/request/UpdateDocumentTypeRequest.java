package com.bika.archive.dto.request;

import jakarta.validation.constraints.NotBlank;

public record UpdateDocumentTypeRequest(
        @NotBlank String name,
        String description
) {
}
