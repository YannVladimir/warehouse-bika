package com.bika.archive.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.UUID;

public record CreateDocumentRequest(
        @Size(max = 50) String documentNumber,
        @NotBlank String title,
        UUID typeId,
        UUID boxLocationId,
        String custodian,
        @Positive Integer pages,
        LocalDate archivedDate,
        String notes,
        UUID companyId,
        @Size(max = 255) String externalReference
) {
}
