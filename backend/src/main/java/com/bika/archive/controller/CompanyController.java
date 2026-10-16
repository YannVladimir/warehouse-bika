package com.bika.archive.controller;

import com.bika.archive.dto.request.CreateCompanyRequest;
import com.bika.archive.dto.request.UpdateCompanyRequest;
import com.bika.archive.dto.response.CompanyResponse;
import com.bika.archive.integration.bikasource.CompanySyncService;
import com.bika.archive.security.AuthenticatedPrincipal;
import com.bika.archive.service.CompanyService;
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
@RequestMapping("/api/companies")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
@Tag(name = "Companies")
public class CompanyController {

    private final CompanyService companyService;
    private final CompanySyncService companySyncService;

    @GetMapping
    public List<CompanyResponse> getAll() {
        return companyService.findAll();
    }

    /**
     * Pulls fresh companies from the bika DMS on demand (called when the Companies page loads)
     * rather than on a fixed schedule, then returns the resulting list.
     */
    @PostMapping("/sync")
    public List<CompanyResponse> sync() {
        companySyncService.syncCompanies();
        return companyService.findAll();
    }

    @GetMapping("/{id}")
    public CompanyResponse getById(@PathVariable UUID id) {
        return companyService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CompanyResponse create(@AuthenticationPrincipal AuthenticatedPrincipal principal, @Valid @RequestBody CreateCompanyRequest request) {
        return companyService.create(principal, request);
    }

    @PutMapping("/{id}")
    public CompanyResponse update(
            @AuthenticationPrincipal AuthenticatedPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCompanyRequest request
    ) {
        return companyService.update(principal, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AuthenticatedPrincipal principal, @PathVariable UUID id) {
        companyService.delete(principal, id);
    }
}
