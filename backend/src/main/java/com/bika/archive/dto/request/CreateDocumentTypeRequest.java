package com.bika.archive.dto.request;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record CreateDocumentTypeRequest(
        @NotBlank String name,
        String description,
        UUID companyId
) {
}
