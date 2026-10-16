package com.bika.archive.dto.response;

import com.bika.archive.domain.enums.Role;
import java.time.Instant;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        String fullName,
        Role role,
        UUID companyId,
        String companyName,
        boolean active,
        Instant lastLoginAt
) {
}
