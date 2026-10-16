package com.bika.archive.controller;

import com.bika.archive.dto.request.CreateDocumentTypeRequest;
import com.bika.archive.dto.request.UpdateDocumentTypeRequest;
import com.bika.archive.dto.response.DocumentTypeResponse;
import com.bika.archive.security.AuthenticatedPrincipal;
import com.bika.archive.service.DocumentTypeService;
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
@RequestMapping("/api/document-types")
@RequiredArgsConstructor
@Tag(name = "Document Types")
public class DocumentTypeController {

    private final DocumentTypeService documentTypeService;

    @GetMapping
    public List<DocumentTypeResponse> getAll(@AuthenticationPrincipal AuthenticatedPrincipal principal) {
        return documentTypeService.findAll(principal);
    }

    @GetMapping("/{id}")
    public DocumentTypeResponse getById(@AuthenticationPrincipal AuthenticatedPrincipal principal, @PathVariable UUID id) {
        return documentTypeService.findById(principal, id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'COMPANY_ADMIN')")
    public DocumentTypeResponse create(
            @AuthenticationPrincipal AuthenticatedPrincipal principal,
            @Valid @RequestBody CreateDocumentTypeRequest request
    ) {
        return documentTypeService.create(principal, request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'COMPANY_ADMIN')")
    public DocumentTypeResponse update(
            @AuthenticationPrincipal AuthenticatedPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDocumentTypeRequest request
    ) {
        return documentTypeService.update(principal, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'COMPANY_ADMIN')")
    public void delete(@AuthenticationPrincipal AuthenticatedPrincipal principal, @PathVariable UUID id) {
        documentTypeService.delete(principal, id);
    }
}
