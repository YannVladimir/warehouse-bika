package com.bika.archive.dto.response;

import java.time.Instant;

public record SearchHistoryResponse(
        String query,
        Instant searchedAt
) {
}
