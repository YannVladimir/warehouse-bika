package com.bika.archive.dto.response;

import com.bika.archive.domain.enums.DocumentStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record DocumentResponse(
        UUID id,
        UUID companyId,
        String companyName,
        String documentNumber,
        String title,
        UUID typeId,
        String typeName,
        DocumentStatus status,
        String custodian,
        Integer pages,
        LocalDate archivedDate,
        String notes,
        UUID boxLocationId,
        LocationPathResponse location,
        Instant createdAt,
        String sourceSystem,
        String externalReference,
        String externalFilerName,
        String externalFilerEmail,
        Long sourceSystemCompanyId
) {
}
