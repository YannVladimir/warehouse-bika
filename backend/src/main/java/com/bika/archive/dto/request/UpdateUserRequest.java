package com.bika.archive.dto.request;

import com.bika.archive.domain.enums.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateUserRequest(
        @NotBlank String fullName,
        @NotNull Role role
) {
}
