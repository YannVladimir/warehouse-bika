package com.bika.archive.repository;

import com.bika.archive.domain.entity.Document;
import com.bika.archive.domain.enums.DocumentStatus;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DocumentRepository extends JpaRepository<Document, UUID> {

    Page<Document> findByCompanyId(UUID companyId, Pageable pageable);

    boolean existsByCompanyIdAndDocumentNumberIgnoreCase(UUID companyId, String documentNumber);

    long countByCompanyIdAndDocumentNumberStartingWith(UUID companyId, String prefix);

    long countByCompanyId(UUID companyId);

    long countByCompanyIdAndStatus(UUID companyId, DocumentStatus status);

    long countByStatus(DocumentStatus status);

    /**
     * companyId/status/typeId/query are all optional (null = no filter on that dimension).
     * Matches full-text (title + custodian, via the generated search_vector column) OR a plain
     * ILIKE on document_number, since structured codes like "DOC-2026-0001" don't tokenize
     * meaningfully well under to_tsvector. Ordering is fixed (most recent first) rather than
     * driven by Pageable's Sort -- native queries and Sort don't reliably mix, and recency is
     * the natural order for search results anyway.
     */
    @Query(value = """
            SELECT * FROM documents d
            WHERE (:companyId IS NULL OR d.company_id = :companyId)
              AND (:status IS NULL OR d.status = :status)
              AND (:typeId IS NULL OR d.type_id = :typeId)
              AND (
                :query IS NULL OR :query = ''
                OR d.search_vector @@ websearch_to_tsquery('english', :query)
                OR d.document_number ILIKE CONCAT('%', :query, '%')
              )
            ORDER BY d.created_at DESC
            """,
            countQuery = """
            SELECT count(*) FROM documents d
            WHERE (:companyId IS NULL OR d.company_id = :companyId)
              AND (:status IS NULL OR d.status = :status)
              AND (:typeId IS NULL OR d.type_id = :typeId)
              AND (
                :query IS NULL OR :query = ''
                OR d.search_vector @@ websearch_to_tsquery('english', :query)
                OR d.document_number ILIKE CONCAT('%', :query, '%')
              )
            """,
            nativeQuery = true)
    Page<Document> search(
            @Param("companyId") UUID companyId,
            @Param("status") String status,
            @Param("typeId") UUID typeId,
            @Param("query") String query,
            Pageable pageable
    );
}
