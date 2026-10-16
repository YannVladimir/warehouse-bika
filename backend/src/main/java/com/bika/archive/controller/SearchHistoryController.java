package com.bika.archive.controller;

import com.bika.archive.dto.response.PageResponse;
import com.bika.archive.dto.response.SearchHistoryReportResponse;
import com.bika.archive.dto.response.SearchHistoryResponse;
import com.bika.archive.security.AuthenticatedPrincipal;
import com.bika.archive.service.SearchHistoryService;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/search-history")
@RequiredArgsConstructor
@Tag(name = "Search History")
public class SearchHistoryController {

    private final SearchHistoryService searchHistoryService;

    @GetMapping
    public List<SearchHistoryResponse> getRecent(@AuthenticationPrincipal AuthenticatedPrincipal principal) {
        return searchHistoryService.getRecent(principal);
    }

    @GetMapping("/report")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'COMPANY_ADMIN')")
    public PageResponse<SearchHistoryReportResponse> report(
            @AuthenticationPrincipal AuthenticatedPrincipal principal,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return searchHistoryService.report(principal, pageable);
    }
}
