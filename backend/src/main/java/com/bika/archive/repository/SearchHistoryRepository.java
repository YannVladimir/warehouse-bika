package com.bika.archive.repository;

import com.bika.archive.domain.entity.SearchHistory;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SearchHistoryRepository extends JpaRepository<SearchHistory, UUID> {

    List<SearchHistory> findTop50ByUserIdOrderByCreatedAtDesc(UUID userId);

    /** Admin-facing report: every search made by anyone in the company, most recent first. */
    Page<SearchHistory> findByCompanyId(UUID companyId, Pageable pageable);
}
