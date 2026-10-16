package com.bika.archive.dto.request;

import jakarta.validation.constraints.NotBlank;

public record HandoffExchangeRequest(@NotBlank String token) {
}
