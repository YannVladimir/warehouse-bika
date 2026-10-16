package com.bika.archive.service;

import com.bika.archive.domain.entity.SearchHistory;
import com.bika.archive.dto.response.PageResponse;
import com.bika.archive.dto.response.SearchHistoryReportResponse;
import com.bika.archive.dto.response.SearchHistoryResponse;
import com.bika.archive.repository.SearchHistoryRepository;
import com.bika.archive.security.AuthenticatedPrincipal;
import java.util.LinkedHashMap;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SearchHistoryService {

    private static final int DISPLAY_LIMIT = 5;

    private final SearchHistoryRepository searchHistoryRepository;

    /**
     * Every search is logged (full history, useful for later reporting), but the display list
     * shown to the user is deduped by query text and capped, most-recent first -- matching the
     * frontend's existing "recent searches" widget behavior.
     */
    @Transactional(readOnly = true)
    public List<SearchHistoryResponse> getRecent(AuthenticatedPrincipal principal) {
        List<SearchHistory> rows = searchHistoryRepository.findTop50ByUserIdOrderByCreatedAtDesc(principal.userId());

        LinkedHashMap<String, SearchHistory> deduped = new LinkedHashMap<>();
        for (SearchHistory row : rows) {
            deduped.putIfAbsent(row.getQuery().toLowerCase(), row);
        }

        return deduped.values().stream()
                .limit(DISPLAY_LIMIT)
                .map(row -> new SearchHistoryResponse(row.getQuery(), row.getCreatedAt()))
                .toList();
    }

    /** Admin report: full, unfiltered search activity across the company (or globally for a super admin). */
    @Transactional(readOnly = true)
    public PageResponse<SearchHistoryReportResponse> report(AuthenticatedPrincipal principal, Pageable pageable) {
        Page<SearchHistory> page = principal.isSuperAdmin()
                ? searchHistoryRepository.findAll(pageable)
                : searchHistoryRepository.findByCompanyId(principal.companyId(), pageable);

        return PageResponse.from(page.map(row -> new SearchHistoryReportResponse(
                row.getUser().getEmail(),
                row.getUser().getFullName(),
                row.getQuery(),
                row.getResultCount(),
                row.getCreatedAt()
        )));
    }
}
