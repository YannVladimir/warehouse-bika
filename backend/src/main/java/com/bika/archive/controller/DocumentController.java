package com.bika.archive.controller;

import com.bika.archive.domain.enums.DocumentStatus;
import com.bika.archive.dto.request.CreateDocumentRequest;
import com.bika.archive.dto.request.UpdateDocumentLocationRequest;
import com.bika.archive.dto.request.UpdateDocumentRequest;
import com.bika.archive.dto.request.UpdateDocumentStatusRequest;
import com.bika.archive.dto.response.DocumentResponse;
import com.bika.archive.dto.response.PageResponse;
import com.bika.archive.integration.bikasource.FilingCallbackService;
import com.bika.archive.security.AuthenticatedPrincipal;
import com.bika.archive.service.DocumentService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
@Tag(name = "Documents")
public class DocumentController {

    private final DocumentService documentService;
    private final FilingCallbackService filingCallbackService;

    @GetMapping
    public PageResponse<DocumentResponse> getAll(
            @AuthenticationPrincipal AuthenticatedPrincipal principal,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return documentService.findAll(principal, pageable);
    }

    @GetMapping("/{id}")
    public DocumentResponse getById(@AuthenticationPrincipal AuthenticatedPrincipal principal, @PathVariable UUID id) {
        return documentService.findById(principal, id);
    }

    @GetMapping("/search")
    public PageResponse<DocumentResponse> search(
            @AuthenticationPrincipal AuthenticatedPrincipal principal,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) DocumentStatus status,
            @RequestParam(required = false) UUID typeId,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return documentService.search(principal, q, status, typeId, pageable);
    }

    /**
     * When the request carries an externalReference (i.e. it was filed via a bika DMS handoff),
     * this also notifies that system of the actual outcome -- generating a handoff link is not
     * the same as the user finishing the form, so their side needs a real completion signal
     * rather than optimistically marking the record as archived the moment the link was sent.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'EXTERNAL_FILER')")
    public DocumentResponse create(
            @AuthenticationPrincipal AuthenticatedPrincipal principal,
            @Valid @RequestBody CreateDocumentRequest request
    ) {
        try {
            DocumentResponse response = documentService.create(principal, request);
            filingCallbackService.notifyCompleted(
                    request.externalReference(), response.sourceSystemCompanyId(), response.id(), response.documentNumber());
            return response;
        } catch (RuntimeException ex) {
            filingCallbackService.notifyFailed(request.externalReference(), ex.getMessage());
            throw ex;
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'COMPANY_ADMIN')")
    public DocumentResponse update(
            @AuthenticationPrincipal AuthenticatedPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDocumentRequest request
    ) {
        return documentService.update(principal, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'COMPANY_ADMIN')")
    public void delete(@AuthenticationPrincipal AuthenticatedPrincipal principal, @PathVariable UUID id) {
        documentService.delete(principal, id);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'COMPANY_ADMIN')")
    public DocumentResponse updateStatus(
            @AuthenticationPrincipal AuthenticatedPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDocumentStatusRequest request
    ) {
        return documentService.updateStatus(principal, id, request);
    }

    @PatchMapping("/{id}/location")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'COMPANY_ADMIN')")
    public DocumentResponse updateLocation(
            @AuthenticationPrincipal AuthenticatedPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDocumentLocationRequest request
    ) {
        return documentService.updateLocation(principal, id, request);
    }
}
