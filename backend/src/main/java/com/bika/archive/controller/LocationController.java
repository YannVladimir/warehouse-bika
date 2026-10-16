package com.bika.archive.controller;

import com.bika.archive.dto.request.CreateLocationNodeRequest;
import com.bika.archive.dto.request.UpdateLocationNodeRequest;
import com.bika.archive.dto.response.LocationNodeResponse;
import com.bika.archive.dto.response.LocationPathResponse;
import com.bika.archive.security.AuthenticatedPrincipal;
import com.bika.archive.service.LocationNodeService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
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
@RequestMapping("/api/locations")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'COMPANY_ADMIN')")
@Tag(name = "Locations")
public class LocationController {

    private final LocationNodeService locationNodeService;

    @GetMapping("/{id}")
    public LocationNodeResponse getById(@AuthenticationPrincipal AuthenticatedPrincipal principal, @PathVariable UUID id) {
        return locationNodeService.findById(principal, id);
    }

    @GetMapping("/{id}/path")
    public LocationPathResponse getPath(@AuthenticationPrincipal AuthenticatedPrincipal principal, @PathVariable UUID id) {
        return locationNodeService.resolvePath(principal, id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LocationNodeResponse create(
            @AuthenticationPrincipal AuthenticatedPrincipal principal,
            @Valid @RequestBody CreateLocationNodeRequest request
    ) {
        return locationNodeService.create(principal, request);
    }

    @PutMapping("/{id}")
    public LocationNodeResponse update(
            @AuthenticationPrincipal AuthenticatedPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateLocationNodeRequest request
    ) {
        return locationNodeService.update(principal, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AuthenticatedPrincipal principal, @PathVariable UUID id) {
        locationNodeService.delete(principal, id);
    }
}
