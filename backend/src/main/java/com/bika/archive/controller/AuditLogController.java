package com.bika.archive.controller;

import com.bika.archive.dto.response.AuditLogResponse;
import com.bika.archive.dto.response.PageResponse;
import com.bika.archive.security.AuthenticatedPrincipal;
import com.bika.archive.service.AuditLogService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'COMPANY_ADMIN')")
@Tag(name = "Audit Logs")
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    public PageResponse<AuditLogResponse> search(
            @AuthenticationPrincipal AuthenticatedPrincipal principal,
            @RequestParam(required = false) String entityType,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return auditLogService.search(principal, entityType, pageable);
    }
}
