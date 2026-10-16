package com.bika.archive.dto.request;

import com.bika.archive.domain.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record CreateUserRequest(
        @NotBlank @Email String email,
        @NotBlank String fullName,
        @NotBlank @Size(min = 8) String password,
        @NotNull Role role,
        UUID companyId
) {
}
