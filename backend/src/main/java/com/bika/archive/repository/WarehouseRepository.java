package com.bika.archive.repository;

import com.bika.archive.domain.entity.Warehouse;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WarehouseRepository extends JpaRepository<Warehouse, UUID> {

    /** A company's own exclusive warehouses plus every shared (company_id null) warehouse. */
    List<Warehouse> findByCompanyIdOrCompanyIdIsNull(UUID companyId);

    boolean existsByCompanyIdAndNameIgnoreCase(UUID companyId, String name);

    boolean existsByCompanyIdIsNullAndNameIgnoreCase(String name);
}
