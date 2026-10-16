package com.bika.archive.controller;

import com.bika.archive.dto.response.DashboardStatsResponse;
import com.bika.archive.dto.response.DocumentResponse;
import com.bika.archive.security.AuthenticatedPrincipal;
import com.bika.archive.service.DashboardService;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public DashboardStatsResponse getStats(@AuthenticationPrincipal AuthenticatedPrincipal principal) {
        return dashboardService.getStats(principal);
    }

    @GetMapping("/recent")
    public List<DocumentResponse> getRecent(@AuthenticationPrincipal AuthenticatedPrincipal principal) {
        return dashboardService.getRecentlyAccessed(principal);
    }
}
