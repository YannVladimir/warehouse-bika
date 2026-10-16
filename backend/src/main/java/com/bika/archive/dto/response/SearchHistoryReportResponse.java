package com.bika.archive.dto.response;

import java.time.Instant;

public record SearchHistoryReportResponse(
        String userEmail,
        String userName,
        String query,
        int resultCount,
        Instant createdAt
) {
}
