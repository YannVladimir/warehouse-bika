package com.bika.archive.repository;

import com.bika.archive.domain.entity.Company;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface CompanyRepository extends JpaRepository<Company, UUID> {

    boolean existsByNameIgnoreCase(String name);

    Optional<Company> findBySourceSystemId(Long sourceSystemId);

    @Query("SELECT MAX(c.sourceSystemSyncedAt) FROM Company c WHERE c.sourceSystemId IS NOT NULL")
    Optional<LocalDateTime> findLatestSourceSystemSyncedAt();
}
