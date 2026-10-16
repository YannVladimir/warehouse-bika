package com.bika.archive.repository;

import com.bika.archive.domain.entity.AuditLog;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    /**
     * companyId/entityType are optional (null = no filter). Ordering is fixed (most recent first)
     * rather than driven by Pageable's Sort, since that's what an audit trail viewer needs.
     */
    @Query("""
            SELECT a FROM AuditLog a
            WHERE (:companyId IS NULL OR a.company.id = :companyId)
              AND (:entityType IS NULL OR a.entityType = :entityType)
            ORDER BY a.createdAt DESC
            """)
    Page<AuditLog> search(@Param("companyId") UUID companyId, @Param("entityType") String entityType, Pageable pageable);
}
