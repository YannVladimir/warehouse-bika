package com.bika.archive.security;

import com.bika.archive.domain.enums.Role;
import java.util.UUID;

public record AuthenticatedPrincipal(UUID userId, String email, Role role, UUID companyId) {

    public boolean isSuperAdmin() {
        return role == Role.SUPER_ADMIN;
    }
}
