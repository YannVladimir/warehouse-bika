package com.bika.archive.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CreateCompanyRequest(
        @NotBlank String name,
        @NotBlank @Email String email,
        String phone,
        String industry
) {
}
