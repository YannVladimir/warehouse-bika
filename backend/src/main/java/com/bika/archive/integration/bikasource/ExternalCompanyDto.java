package com.bika.archive.integration.bikasource;

import java.time.LocalDateTime;

/**
 * Mirrors the JSON shape returned by the bika DMS's GET /v1/companies/export.
 */
public record ExternalCompanyDto(
        Long id,
        String name,
        String code,
        String email,
        String phone,
        String address,
        String description,
        boolean active,
        LocalDateTime updatedAt
) {
}
