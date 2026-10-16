package com.bika.archive.repository;

import com.bika.archive.domain.entity.RecentlyAccessed;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecentlyAccessedRepository extends JpaRepository<RecentlyAccessed, UUID> {

    Optional<RecentlyAccessed> findByUserIdAndDocumentId(UUID userId, UUID documentId);

    List<RecentlyAccessed> findTop4ByUserIdOrderByAccessedAtDesc(UUID userId);
}
