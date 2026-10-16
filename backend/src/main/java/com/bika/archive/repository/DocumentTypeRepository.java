package com.bika.archive.repository;

import com.bika.archive.domain.entity.DocumentType;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DocumentTypeRepository extends JpaRepository<DocumentType, UUID> {

    List<DocumentType> findByCompanyId(UUID companyId);

    boolean existsByCompanyIdAndNameIgnoreCase(UUID companyId, String name);
}
