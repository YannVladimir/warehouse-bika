package com.bika.archive.service;

import com.bika.archive.domain.entity.LocationNode;
import com.bika.archive.domain.entity.Warehouse;
import com.bika.archive.dto.request.CreateLocationNodeRequest;
import com.bika.archive.dto.request.UpdateLocationNodeRequest;
import com.bika.archive.dto.response.LocationNodeResponse;
import com.bika.archive.dto.response.LocationNodeTreeResponse;
import com.bika.archive.dto.response.LocationPathResponse;
import com.bika.archive.dto.response.LocationPathSegment;
import com.bika.archive.exception.ResourceNotFoundException;
import com.bika.archive.mapper.LocationNodeMapper;
import com.bika.archive.repository.LocationNodeRepository;
import com.bika.archive.security.AuthenticatedPrincipal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LocationNodeService {

    private final LocationNodeRepository locationNodeRepository;
    private final WarehouseService warehouseService;
    private final LocationNodeMapper locationNodeMapper;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<LocationNodeTreeResponse> getTree(AuthenticatedPrincipal principal, UUID warehouseId) {
        Warehouse warehouse = warehouseService.getViewableOrThrow(principal, warehouseId);
        List<LocationNode> allNodes = locationNodeRepository.findByWarehouseId(warehouse.getId());

        Map<UUID, List<LocationNode>> byParentId = allNodes.stream()
                .filter(n -> n.getParent() != null)
                .collect(Collectors.groupingBy(n -> n.getParent().getId()));

        return allNodes.stream()
                .filter(n -> n.getParent() == null)
                .map(root -> buildTree(root, byParentId))
                .toList();
    }

    private LocationNodeTreeResponse buildTree(LocationNode node, Map<UUID, List<LocationNode>> byParentId) {
        List<LocationNodeTreeResponse> children = byParentId.getOrDefault(node.getId(), List.of()).stream()
                .map(child -> buildTree(child, byParentId))
                .toList();
        return new LocationNodeTreeResponse(node.getId(), node.getNodeType(), node.getName(), node.getDescription(), node.getCapacity(), node.isStorageUnit(), children);
    }

    @Transactional(readOnly = true)
    public LocationNodeResponse findById(AuthenticatedPrincipal principal, UUID id) {
        return locationNodeMapper.toResponse(getViewableOrThrow(principal, id));
    }

    @Transactional(readOnly = true)
    public LocationPathResponse resolvePath(AuthenticatedPrincipal principal, UUID id) {
        return resolvePathForNode(getViewableOrThrow(principal, id));
    }

    /**
     * Builds the breadcrumb for a node the caller has already fetched and tenant-checked itself
     * (e.g. DocumentService resolving a document's box). Skips re-checking access.
     */
    @Transactional(readOnly = true)
    public LocationPathResponse resolvePathForNode(LocationNode node) {
        List<LocationNode> ancestors = collectAncestorsRootFirst(node);

        List<LocationPathSegment> segments = ancestors.stream()
                .map(n -> new LocationPathSegment(n.getNodeType(), n.getName()))
                .toList();

        Warehouse warehouse = node.getWarehouse();
        return new LocationPathResponse(warehouse.getId(), warehouse.getName(), segments);
    }

    private List<LocationNode> collectAncestorsRootFirst(LocationNode node) {
        if (node.getParent() == null) {
            List<LocationNode> path = new ArrayList<>();
            path.add(node);
            return path;
        }
        List<LocationNode> path = collectAncestorsRootFirst(node.getParent());
        path.add(node);
        return path;
    }

    @Transactional
    public LocationNodeResponse create(AuthenticatedPrincipal principal, CreateLocationNodeRequest request) {
        // Building out a tree is a write on the warehouse: only its owner (or a super admin for a
        // shared warehouse) may do it -- a company can use a shared facility's boxes but doesn't
        // get to add structure to a facility it doesn't own.
        Warehouse warehouse = warehouseService.getWritableOrThrow(principal, request.warehouseId());
        LocationNode parent = resolveParent(warehouse, request.parentId());

        LocationNode node = new LocationNode();
        node.setCompany(warehouse.getCompany());
        node.setWarehouse(warehouse);
        node.setParent(parent);
        node.setNodeType(request.nodeType());
        node.setName(request.name());
        node.setDescription(request.description());
        node.setCapacity(request.capacity());
        node.setStorageUnit(request.storageUnit());

        LocationNode saved = locationNodeRepository.save(node);
        UUID companyId = warehouse.getCompany() != null ? warehouse.getCompany().getId() : null;
        auditService.record(
                principal.userId(), companyId, "LOCATION_NODE", saved.getId().toString(),
                "CREATE_LOCATION", null, saved.getNodeType() + ":" + saved.getName()
        );
        return locationNodeMapper.toResponse(saved);
    }

    /**
     * The hierarchy is company-defined, not a fixed sequence: a node can go anywhere under the
     * same warehouse (or be a root, if parentId is null), as long as its parent isn't itself a
     * storage unit -- a leaf where documents live can't also have child locations.
     */
    private LocationNode resolveParent(Warehouse warehouse, UUID parentId) {
        if (parentId == null) {
            return null;
        }

        LocationNode parent = locationNodeRepository.findById(parentId)
                .orElseThrow(() -> new ResourceNotFoundException("Parent location not found: " + parentId));

        if (!parent.getWarehouse().getId().equals(warehouse.getId())) {
            throw new IllegalArgumentException("Parent location belongs to a different warehouse");
        }
        if (parent.isStorageUnit()) {
            throw new IllegalArgumentException("\"" + parent.getName() + "\" is a storage unit and cannot contain further locations");
        }
        return parent;
    }

    @Transactional
    public LocationNodeResponse update(AuthenticatedPrincipal principal, UUID id, UpdateLocationNodeRequest request) {
        LocationNode node = getWritableOrThrow(principal, id);
        String oldName = node.getName();

        node.setName(request.name());
        node.setDescription(request.description());
        node.setCapacity(request.capacity());

        UUID companyId = node.getCompany() != null ? node.getCompany().getId() : null;
        auditService.record(principal.userId(), companyId, "LOCATION_NODE", id.toString(), "UPDATE_LOCATION", oldName, request.name());
        return locationNodeMapper.toResponse(node);
    }

    @Transactional
    public void delete(AuthenticatedPrincipal principal, UUID id) {
        LocationNode node = getWritableOrThrow(principal, id);
        UUID companyId = node.getCompany() != null ? node.getCompany().getId() : null;
        String label = node.getNodeType() + ":" + node.getName();

        locationNodeRepository.delete(node);
        auditService.record(principal.userId(), companyId, "LOCATION_NODE", id.toString(), "DELETE_LOCATION", label, null);
    }

    /** Read access mirrors the owning warehouse: own-company nodes plus anything in a shared warehouse. */
    private LocationNode getViewableOrThrow(AuthenticatedPrincipal principal, UUID id) {
        LocationNode node = locationNodeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location not found: " + id));

        if (principal.isSuperAdmin()) {
            return node;
        }
        UUID nodeCompanyId = node.getCompany() != null ? node.getCompany().getId() : null;
        if (nodeCompanyId == null || nodeCompanyId.equals(principal.companyId())) {
            return node;
        }
        throw new ResourceNotFoundException("Location not found: " + id);
    }

    /** Write access: a shared-warehouse node can only be modified by a super admin. */
    private LocationNode getWritableOrThrow(AuthenticatedPrincipal principal, UUID id) {
        LocationNode node = getViewableOrThrow(principal, id);
        if (principal.isSuperAdmin()) {
            return node;
        }
        UUID nodeCompanyId = node.getCompany() != null ? node.getCompany().getId() : null;
        if (nodeCompanyId != null && nodeCompanyId.equals(principal.companyId())) {
            return node;
        }
        throw new AccessDeniedException("Only a super admin can modify a shared location");
    }
}
