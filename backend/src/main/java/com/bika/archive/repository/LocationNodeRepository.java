package com.bika.archive.repository;

import com.bika.archive.domain.entity.LocationNode;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LocationNodeRepository extends JpaRepository<LocationNode, UUID> {

    List<LocationNode> findByWarehouseId(UUID warehouseId);
}
