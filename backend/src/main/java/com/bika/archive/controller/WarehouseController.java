package com.bika.archive.controller;

import com.bika.archive.dto.request.CreateWarehouseRequest;
import com.bika.archive.dto.request.UpdateWarehouseRequest;
import com.bika.archive.dto.response.LocationNodeTreeResponse;
import com.bika.archive.dto.response.WarehouseResponse;
import com.bika.archive.security.AuthenticatedPrincipal;
import com.bika.archive.service.LocationNodeService;
import com.bika.archive.service.WarehouseService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/warehouses")
@RequiredArgsConstructor
@Tag(name = "Warehouses")
public class WarehouseController {

    private final WarehouseService warehouseService;
    private final LocationNodeService locationNodeService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'EXTERNAL_FILER')")
    public List<WarehouseResponse> getAll(@AuthenticationPrincipal AuthenticatedPrincipal principal) {
        return warehouseService.findAll(principal);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'EXTERNAL_FILER')")
    public WarehouseResponse getById(@AuthenticationPrincipal AuthenticatedPrincipal principal, @PathVariable UUID id) {
        return warehouseService.findById(principal, id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'COMPANY_ADMIN')")
    public WarehouseResponse create(
            @AuthenticationPrincipal AuthenticatedPrincipal principal,
            @Valid @RequestBody CreateWarehouseRequest request
    ) {
        return warehouseService.create(principal, request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'COMPANY_ADMIN')")
    public WarehouseResponse update(
            @AuthenticationPrincipal AuthenticatedPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateWarehouseRequest request
    ) {
        return warehouseService.update(principal, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'COMPANY_ADMIN')")
    public void delete(@AuthenticationPrincipal AuthenticatedPrincipal principal, @PathVariable UUID id) {
        warehouseService.delete(principal, id);
    }

    @GetMapping("/{id}/locations")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'EXTERNAL_FILER')")
    public List<LocationNodeTreeResponse> getLocationTree(
            @AuthenticationPrincipal AuthenticatedPrincipal principal,
            @PathVariable UUID id
    ) {
        return locationNodeService.getTree(principal, id);
    }
}
