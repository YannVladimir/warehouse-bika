package com.bika.archive.dto.response;

public record DashboardStatsResponse(
        long total,
        long available,
        long checkedOut,
        long missing
) {
}
