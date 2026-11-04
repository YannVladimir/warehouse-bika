package com.bika.archive.service;

import com.bika.archive.domain.entity.Company;
import com.bika.archive.domain.entity.LocationNode;
import com.bika.archive.domain.entity.Warehouse;
import com.bika.archive.domain.enums.Role;
import com.bika.archive.dto.request.CreateLocationNodeRequest;
import com.bika.archive.dto.request.UpdateLocationNodeRequest;
import com.bika.archive.dto.response.LocationNodeResponse;
import com.bika.archive.dto.response.LocationNodeTreeResponse;
import com.bika.archive.dto.response.LocationPathResponse;
import com.bika.archive.exception.ResourceNotFoundException;
import com.bika.archive.mapper.LocationNodeMapper;
import com.bika.archive.repository.LocationNodeRepository;
import com.bika.archive.security.AuthenticatedPrincipal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Note: tests are flat (no @Nested classes) -- this project's Surefire setup
 * silently discovers zero tests for any class using @Nested (confirmed with a
 * minimal reproduction), so flat, descriptively-named methods are used
 * instead.
 */
@ExtendWith(MockitoExtension.class)
class LocationNodeServiceTest {

    @Mock
    private LocationNodeRepository locationNodeRepository;
    @Mock
    private WarehouseService warehouseService;
    @Mock
    private LocationNodeMapper locationNodeMapper;
    @Mock
    private AuditService auditService;

    private LocationNodeService service;

    private Company companyA;
    private Company companyB;
    private Warehouse ownedWarehouse;
    private AuthenticatedPrincipal companyAUser;
    private AuthenticatedPrincipal companyBUser;
    private AuthenticatedPrincipal superAdmin;

    @BeforeEach
    void setUp() {
        service = new LocationNodeService(locationNodeRepository, warehouseService, locationNodeMapper, auditService);

        companyA = new Company();
        companyA.setId(UUID.randomUUID());
        companyB = new Company();
        companyB.setId(UUID.randomUUID());

        ownedWarehouse = new Warehouse();
        ownedWarehouse.setId(UUID.randomUUID());
        ownedWarehouse.setCompany(companyA);

        companyAUser = new AuthenticatedPrincipal(UUID.randomUUID(), "user@a.com", Role.USER, companyA.getId());
        companyBUser = new AuthenticatedPrincipal(UUID.randomUUID(), "user@b.com", Role.USER, companyB.getId());
        superAdmin = new AuthenticatedPrincipal(UUID.randomUUID(), "root@bika.com", Role.SUPER_ADMIN, null);
    }

    private LocationNode node(UUID id, Company company, Warehouse warehouse, LocationNode parent, boolean storageUnit) {
        LocationNode node = new LocationNode();
        node.setId(id);
        node.setCompany(company);
        node.setWarehouse(warehouse);
        node.setParent(parent);
        node.setNodeType(parent == null ? "Room" : "Shelf");
        node.setName("Node " + id);
        node.setStorageUnit(storageUnit);
        return node;
    }

    // --- Tenant isolation ---

    @Test
    void tenantIsolation_sameCompanyUserCanViewTheirOwnNode() {
        LocationNode node = node(UUID.randomUUID(), companyA, ownedWarehouse, null, false);
        when(locationNodeRepository.findById(node.getId())).thenReturn(Optional.of(node));
        when(locationNodeMapper.toResponse(node)).thenReturn(
                new LocationNodeResponse(node.getId(), ownedWarehouse.getId(), null, "Room", node.getName(), null, null, false, null));

        LocationNodeResponse response = service.findById(companyAUser, node.getId());

        assertThat(response.id()).isEqualTo(node.getId());
    }

    @Test
    void tenantIsolation_differentCompanyUserCannotSeeTheNodeAtAll() {
        // Tenant isolation: a cross-tenant lookup must 404, not 403 -- it shouldn't even
        // confirm the node exists to someone outside the owning company.
        LocationNode node = node(UUID.randomUUID(), companyA, ownedWarehouse, null, false);
        when(locationNodeRepository.findById(node.getId())).thenReturn(Optional.of(node));

        assertThatThrownBy(() -> service.findById(companyBUser, node.getId()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void tenantIsolation_superAdminCanViewAnyCompanysNode() {
        LocationNode node = node(UUID.randomUUID(), companyA, ownedWarehouse, null, false);
        when(locationNodeRepository.findById(node.getId())).thenReturn(Optional.of(node));
        when(locationNodeMapper.toResponse(node)).thenReturn(
                new LocationNodeResponse(node.getId(), ownedWarehouse.getId(), null, "Room", node.getName(), null, null, false, null));

        LocationNodeResponse response = service.findById(superAdmin, node.getId());

        assertThat(response.id()).isEqualTo(node.getId());
    }

    @Test
    void tenantIsolation_sharedWarehouseNodeHasNullCompanyAndIsViewableByAnyone() {
        LocationNode sharedNode = node(UUID.randomUUID(), null, ownedWarehouse, null, false);
        when(locationNodeRepository.findById(sharedNode.getId())).thenReturn(Optional.of(sharedNode));
        when(locationNodeMapper.toResponse(sharedNode)).thenReturn(
                new LocationNodeResponse(sharedNode.getId(), ownedWarehouse.getId(), null, "Room", sharedNode.getName(), null, null, false, null));

        LocationNodeResponse response = service.findById(companyBUser, sharedNode.getId());

        assertThat(response.id()).isEqualTo(sharedNode.getId());
    }

    @Test
    void tenantIsolation_onlySuperAdminCanModifyASharedWarehouseNode() {
        LocationNode sharedNode = node(UUID.randomUUID(), null, ownedWarehouse, null, false);
        when(locationNodeRepository.findById(sharedNode.getId())).thenReturn(Optional.of(sharedNode));

        assertThatThrownBy(() -> service.update(companyAUser, sharedNode.getId(),
                new UpdateLocationNodeRequest("New name", null, null)))
                .isInstanceOf(AccessDeniedException.class);
    }

    // --- Create validation ---

    @Test
    void create_rejectsAParentFromADifferentWarehouse() {
        Warehouse otherWarehouse = new Warehouse();
        otherWarehouse.setId(UUID.randomUUID());
        otherWarehouse.setCompany(companyA);
        LocationNode parentInOtherWarehouse = node(UUID.randomUUID(), companyA, otherWarehouse, null, false);

        when(warehouseService.getWritableOrThrow(companyAUser, ownedWarehouse.getId())).thenReturn(ownedWarehouse);
        when(locationNodeRepository.findById(parentInOtherWarehouse.getId()))
                .thenReturn(Optional.of(parentInOtherWarehouse));

        CreateLocationNodeRequest request = new CreateLocationNodeRequest(
                ownedWarehouse.getId(), parentInOtherWarehouse.getId(), "Shelf", "Shelf 1", null, null, false);

        assertThatThrownBy(() -> service.create(companyAUser, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("different warehouse");
    }

    @Test
    void create_rejectsNestingUnderAStorageUnit() {
        // A storage unit is where documents actually live -- it can't also have children.
        LocationNode storageUnitParent = node(UUID.randomUUID(), companyA, ownedWarehouse, null, true);

        when(warehouseService.getWritableOrThrow(companyAUser, ownedWarehouse.getId())).thenReturn(ownedWarehouse);
        when(locationNodeRepository.findById(storageUnitParent.getId())).thenReturn(Optional.of(storageUnitParent));

        CreateLocationNodeRequest request = new CreateLocationNodeRequest(
                ownedWarehouse.getId(), storageUnitParent.getId(), "Shelf", "Shelf 1", null, null, false);

        assertThatThrownBy(() -> service.create(companyAUser, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("storage unit");
    }

    @Test
    void create_createsARootNodeAndRecordsAnAuditEntry() {
        when(warehouseService.getWritableOrThrow(companyAUser, ownedWarehouse.getId())).thenReturn(ownedWarehouse);
        when(locationNodeRepository.save(any(LocationNode.class))).thenAnswer(invocation -> {
            LocationNode toSave = invocation.getArgument(0);
            toSave.setId(UUID.randomUUID());
            return toSave;
        });
        when(locationNodeMapper.toResponse(any(LocationNode.class))).thenAnswer(invocation -> {
            LocationNode saved = invocation.getArgument(0);
            return new LocationNodeResponse(saved.getId(), ownedWarehouse.getId(), null, saved.getNodeType(), saved.getName(), null, null, false, null);
        });

        CreateLocationNodeRequest request = new CreateLocationNodeRequest(
                ownedWarehouse.getId(), null, "Room", "Archive Room", null, null, false);

        LocationNodeResponse response = service.create(companyAUser, request);

        assertThat(response.name()).isEqualTo("Archive Room");
        Mockito.verify(auditService).record(
                ArgumentMatchers.eq(companyAUser.userId()),
                ArgumentMatchers.eq(companyA.getId()),
                ArgumentMatchers.eq("LOCATION_NODE"),
                any(), ArgumentMatchers.eq("CREATE_LOCATION"),
                any(), any());
    }

    // --- Path resolution and tree building ---

    @Test
    void path_resolvesTheBreadcrumbRootFirst() {
        LocationNode root = node(UUID.randomUUID(), companyA, ownedWarehouse, null, false);
        root.setName("Building A");
        LocationNode mid = node(UUID.randomUUID(), companyA, ownedWarehouse, root, false);
        mid.setName("Wing 2");
        LocationNode leaf = node(UUID.randomUUID(), companyA, ownedWarehouse, mid, true);
        leaf.setName("Box 7");
        ownedWarehouse.setName("Main Warehouse");

        LocationPathResponse path = service.resolvePathForNode(leaf);

        assertThat(path.warehouseName()).isEqualTo("Main Warehouse");
        assertThat(path.segments()).hasSize(3);
        assertThat(path.segments().get(0).name()).isEqualTo("Building A");
        assertThat(path.segments().get(1).name()).isEqualTo("Wing 2");
        assertThat(path.segments().get(2).name()).isEqualTo("Box 7");
    }

    @Test
    void tree_buildsANestedTreeFromAFlatList() {
        LocationNode root = node(UUID.randomUUID(), companyA, ownedWarehouse, null, false);
        LocationNode child = node(UUID.randomUUID(), companyA, ownedWarehouse, root, false);
        LocationNode grandchild = node(UUID.randomUUID(), companyA, ownedWarehouse, child, true);

        when(warehouseService.getViewableOrThrow(companyAUser, ownedWarehouse.getId())).thenReturn(ownedWarehouse);
        when(locationNodeRepository.findByWarehouseId(ownedWarehouse.getId()))
                .thenReturn(List.of(root, child, grandchild));

        List<LocationNodeTreeResponse> tree = service.getTree(companyAUser, ownedWarehouse.getId());

        assertThat(tree).hasSize(1);
        assertThat(tree.get(0).id()).isEqualTo(root.getId());
        assertThat(tree.get(0).children()).hasSize(1);
        assertThat(tree.get(0).children().get(0).children()).hasSize(1);
    }
}
