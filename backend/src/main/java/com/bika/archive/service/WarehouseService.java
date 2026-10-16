package com.bika.archive.service;

import com.bika.archive.domain.entity.Company;
import com.bika.archive.domain.entity.Warehouse;
import com.bika.archive.dto.request.CreateWarehouseRequest;
import com.bika.archive.dto.request.UpdateWarehouseRequest;
import com.bika.archive.dto.response.WarehouseResponse;
import com.bika.archive.exception.DuplicateResourceException;
import com.bika.archive.exception.ResourceNotFoundException;
import com.bika.archive.mapper.WarehouseMapper;
import com.bika.archive.repository.CompanyRepository;
import com.bika.archive.repository.WarehouseRepository;
import com.bika.archive.security.AuthenticatedPrincipal;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class WarehouseService {

    private final WarehouseRepository warehouseRepository;
    private final CompanyRepository companyRepository;
    private final WarehouseMapper warehouseMapper;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<WarehouseResponse> findAll(AuthenticatedPrincipal principal) {
        List<Warehouse> warehouses = principal.isSuperAdmin()
                ? warehouseRepository.findAll()
                : warehouseRepository.findByCompanyIdOrCompanyIdIsNull(principal.companyId());
        return warehouses.stream().map(warehouseMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public WarehouseResponse findById(AuthenticatedPrincipal principal, UUID id) {
        return warehouseMapper.toResponse(getViewableOrThrow(principal, id));
    }

    /**
     * A SUPER_ADMIN always creates a shared warehouse (no owning company -- usable by any tenant,
     * e.g. a third-party facility). A COMPANY_ADMIN always creates one exclusive to their own
     * company. Which kind you get is determined by who's creating it, not a field you choose.
     */
    @Transactional
    public WarehouseResponse create(AuthenticatedPrincipal principal, CreateWarehouseRequest request) {
        if (principal.isSuperAdmin()) {
            if (warehouseRepository.existsByCompanyIdIsNullAndNameIgnoreCase(request.name())) {
                throw new DuplicateResourceException("A shared warehouse named '" + request.name() + "' already exists");
            }
            Warehouse warehouse = buildWarehouse(null, request);
            Warehouse saved = warehouseRepository.save(warehouse);
            auditService.record(principal.userId(), null, "WAREHOUSE", saved.getId().toString(), "CREATE_WAREHOUSE", null, saved.getName() + " (shared)");
            return warehouseMapper.toResponse(saved);
        }

        UUID companyId = principal.companyId();
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found: " + companyId));

        if (warehouseRepository.existsByCompanyIdAndNameIgnoreCase(companyId, request.name())) {
            throw new DuplicateResourceException("A warehouse named '" + request.name() + "' already exists for this company");
        }

        Warehouse warehouse = buildWarehouse(company, request);
        Warehouse saved = warehouseRepository.save(warehouse);
        auditService.record(principal.userId(), companyId, "WAREHOUSE", saved.getId().toString(), "CREATE_WAREHOUSE", null, saved.getName());
        return warehouseMapper.toResponse(saved);
    }

    private Warehouse buildWarehouse(Company company, CreateWarehouseRequest request) {
        Warehouse warehouse = new Warehouse();
        warehouse.setCompany(company);
        warehouse.setName(request.name());
        warehouse.setAddress(request.address());
        warehouse.setCity(request.city());
        warehouse.setManagerName(request.managerName());
        warehouse.setActive(true);
        return warehouse;
    }

    @Transactional
    public WarehouseResponse update(AuthenticatedPrincipal principal, UUID id, UpdateWarehouseRequest request) {
        Warehouse warehouse = getWritableOrThrow(principal, id);
        UUID companyId = warehouse.getCompany() != null ? warehouse.getCompany().getId() : null;

        boolean nameTaken = companyId != null
                ? !warehouse.getName().equalsIgnoreCase(request.name()) && warehouseRepository.existsByCompanyIdAndNameIgnoreCase(companyId, request.name())
                : !warehouse.getName().equalsIgnoreCase(request.name()) && warehouseRepository.existsByCompanyIdIsNullAndNameIgnoreCase(request.name());
        if (nameTaken) {
            throw new DuplicateResourceException("A warehouse named '" + request.name() + "' already exists");
        }

        String oldName = warehouse.getName();
        warehouse.setName(request.name());
        warehouse.setAddress(request.address());
        warehouse.setCity(request.city());
        warehouse.setManagerName(request.managerName());
        warehouse.setActive(request.active());

        auditService.record(principal.userId(), companyId, "WAREHOUSE", id.toString(), "UPDATE_WAREHOUSE", oldName, request.name());
        return warehouseMapper.toResponse(warehouse);
    }

    @Transactional
    public void delete(AuthenticatedPrincipal principal, UUID id) {
        Warehouse warehouse = getWritableOrThrow(principal, id);
        UUID companyId = warehouse.getCompany() != null ? warehouse.getCompany().getId() : null;
        String name = warehouse.getName();

        warehouseRepository.delete(warehouse);
        auditService.record(principal.userId(), companyId, "WAREHOUSE", id.toString(), "DELETE_WAREHOUSE", name, null);
    }

    /**
     * Read access: a company can see (and pick locations inside) its own warehouses plus any
     * shared one. Package-visible so LocationNodeService can reuse this for the same rule.
     */
    public Warehouse getViewableOrThrow(AuthenticatedPrincipal principal, UUID id) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found: " + id));

        if (principal.isSuperAdmin()) {
            return warehouse;
        }
        UUID warehouseCompanyId = warehouse.getCompany() != null ? warehouse.getCompany().getId() : null;
        if (warehouseCompanyId == null || warehouseCompanyId.equals(principal.companyId())) {
            return warehouse;
        }
        throw new ResourceNotFoundException("Warehouse not found: " + id);
    }

    /**
     * Write access: only a SUPER_ADMIN may modify a shared warehouse's shell or its location
     * tree -- a company can use a shared facility's boxes but doesn't manage that facility.
     */
    public Warehouse getWritableOrThrow(AuthenticatedPrincipal principal, UUID id) {
        Warehouse warehouse = getViewableOrThrow(principal, id);
        if (principal.isSuperAdmin()) {
            return warehouse;
        }
        UUID warehouseCompanyId = warehouse.getCompany() != null ? warehouse.getCompany().getId() : null;
        if (warehouseCompanyId != null && warehouseCompanyId.equals(principal.companyId())) {
            return warehouse;
        }
        throw new AccessDeniedException("Only a super admin can modify a shared warehouse");
    }
}
