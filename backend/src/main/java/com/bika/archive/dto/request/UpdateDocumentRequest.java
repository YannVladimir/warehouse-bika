package com.bika.archive.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import java.time.LocalDate;
import java.util.UUID;

public record UpdateDocumentRequest(
        @NotBlank String title,
        UUID typeId,
        String custodian,
        @Positive Integer pages,
        LocalDate archivedDate,
        String notes
) {
}
