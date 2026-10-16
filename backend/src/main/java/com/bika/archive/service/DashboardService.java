package com.bika.archive.service;

import com.bika.archive.domain.entity.RecentlyAccessed;
import com.bika.archive.domain.enums.DocumentStatus;
import com.bika.archive.dto.response.DashboardStatsResponse;
import com.bika.archive.dto.response.DocumentResponse;
import com.bika.archive.repository.DocumentRepository;
import com.bika.archive.repository.RecentlyAccessedRepository;
import com.bika.archive.security.AuthenticatedPrincipal;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final DocumentRepository documentRepository;
    private final RecentlyAccessedRepository recentlyAccessedRepository;
    private final DocumentService documentService;

    @Transactional(readOnly = true)
    public DashboardStatsResponse getStats(AuthenticatedPrincipal principal) {
        UUID companyId = principal.isSuperAdmin() ? null : principal.companyId();

        long total = companyId != null ? documentRepository.countByCompanyId(companyId) : documentRepository.count();
        long available = countByStatus(companyId, DocumentStatus.AVAILABLE);
        long checkedOut = countByStatus(companyId, DocumentStatus.CHECKED_OUT);
        long missing = countByStatus(companyId, DocumentStatus.MISSING);

        return new DashboardStatsResponse(total, available, checkedOut, missing);
    }

    private long countByStatus(UUID companyId, DocumentStatus status) {
        return companyId != null
                ? documentRepository.countByCompanyIdAndStatus(companyId, status)
                : documentRepository.countByStatus(status);
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> getRecentlyAccessed(AuthenticatedPrincipal principal) {
        List<RecentlyAccessed> entries = recentlyAccessedRepository.findTop4ByUserIdOrderByAccessedAtDesc(principal.userId());
        return entries.stream().map(entry -> documentService.toResponse(entry.getDocument())).toList();
    }
}
