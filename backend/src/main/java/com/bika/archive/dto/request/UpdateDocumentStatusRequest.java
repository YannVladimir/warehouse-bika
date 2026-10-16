package com.bika.archive.dto.request;

import com.bika.archive.domain.enums.DocumentStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateDocumentStatusRequest(
        @NotNull DocumentStatus status
) {
}
