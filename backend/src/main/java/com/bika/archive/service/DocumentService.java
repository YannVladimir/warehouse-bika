package com.bika.archive.service;

import com.bika.archive.domain.entity.Company;
import com.bika.archive.domain.entity.Document;
import com.bika.archive.domain.entity.DocumentType;
import com.bika.archive.domain.entity.LocationNode;
import com.bika.archive.domain.entity.RecentlyAccessed;
import com.bika.archive.domain.entity.SearchHistory;
import com.bika.archive.domain.entity.User;
import com.bika.archive.domain.enums.DocumentStatus;
import com.bika.archive.domain.enums.Role;
import com.bika.archive.dto.request.CreateDocumentRequest;
import com.bika.archive.dto.request.UpdateDocumentLocationRequest;
import com.bika.archive.dto.request.UpdateDocumentRequest;
import com.bika.archive.dto.request.UpdateDocumentStatusRequest;
import com.bika.archive.dto.response.DocumentResponse;
import com.bika.archive.dto.response.LocationPathResponse;
import com.bika.archive.dto.response.PageResponse;
import com.bika.archive.exception.DuplicateResourceException;
import com.bika.archive.exception.ResourceNotFoundException;
import com.bika.archive.repository.CompanyRepository;
import com.bika.archive.repository.DocumentRepository;
import com.bika.archive.repository.LocationNodeRepository;
import com.bika.archive.repository.RecentlyAccessedRepository;
import com.bika.archive.repository.SearchHistoryRepository;
import com.bika.archive.repository.UserRepository;
import com.bika.archive.security.AuthenticatedPrincipal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private static final String SOURCE_BIKA_FILING_SYSTEM = "BIKA_FILING_SYSTEM";

    private final DocumentRepository documentRepository;
    private final CompanyRepository companyRepository;
    private final LocationNodeRepository locationNodeRepository;
    private final UserRepository userRepository;
    private final SearchHistoryRepository searchHistoryRepository;
    private final RecentlyAccessedRepository recentlyAccessedRepository;
    private final DocumentTypeService documentTypeService;
    private final LocationNodeService locationNodeService;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public PageResponse<DocumentResponse> findAll(AuthenticatedPrincipal principal, Pageable pageable) {
        Page<Document> documents = principal.isSuperAdmin()
                ? documentRepository.findAll(pageable)
                : documentRepository.findByCompanyId(principal.companyId(), pageable);
        return PageResponse.from(documents.map(this::toResponse));
    }

    @Transactional
    public DocumentResponse findById(AuthenticatedPrincipal principal, UUID id) {
        Document document = getScopedOrThrow(principal, id);
        trackRecentlyAccessed(principal.userId(), document);
        return toResponse(document);
    }

    /**
     * Full-text search (title + custodian via the generated search_vector column) with a plain
     * ILIKE fallback on document_number, optionally filtered by status/type, tenant-scoped.
     * Logs a search_history row whenever a non-blank query is actually submitted.
     */
    @Transactional
    public PageResponse<DocumentResponse> search(
            AuthenticatedPrincipal principal, String query, DocumentStatus status, UUID typeId, Pageable pageable
    ) {
        UUID companyId = principal.isSuperAdmin() ? null : principal.companyId();
        String normalizedQuery = query != null ? query.trim() : null;
        String statusName = status != null ? status.name() : null;

        Page<Document> results = documentRepository.search(companyId, statusName, typeId, normalizedQuery, pageable);

        if (normalizedQuery != null && !normalizedQuery.isBlank()) {
            SearchHistory history = new SearchHistory();
            history.setUser(userRepository.getReferenceById(principal.userId()));
            history.setCompany(companyId != null ? companyRepository.getReferenceById(companyId) : null);
            history.setQuery(normalizedQuery);
            history.setResultCount((int) results.getTotalElements());
            searchHistoryRepository.save(history);
        }

        return PageResponse.from(results.map(this::toResponse));
    }

    @Transactional
    public DocumentResponse create(AuthenticatedPrincipal principal, CreateDocumentRequest request) {
        UUID targetCompanyId = principal.isSuperAdmin() ? request.companyId() : principal.companyId();
        if (targetCompanyId == null) {
            throw new IllegalArgumentException("A company must be specified");
        }

        Company company = companyRepository.findById(targetCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found: " + targetCompanyId));

        String documentNumber = resolveDocumentNumber(targetCompanyId, request.documentNumber());

        DocumentType type = request.typeId() != null
                ? documentTypeService.getScopedForCompanyOrThrow(targetCompanyId, request.typeId())
                : null;

        LocationNode boxLocation = request.boxLocationId() != null
                ? resolveBoxLocation(targetCompanyId, request.boxLocationId())
                : null;

        Document document = new Document();
        document.setCompany(company);
        document.setDocumentNumber(documentNumber);
        document.setTitle(request.title());
        document.setType(type);
        document.setBoxLocation(boxLocation);
        document.setCustodian(request.custodian());
        document.setPages(request.pages());
        document.setArchivedDate(request.archivedDate());
        document.setNotes(request.notes());
        document.setExternalReference(request.externalReference());

        // Source/filer identity is derived server-side from the authenticated principal, never
        // taken from the request body -- a client can't spoof "this came from the filing system".
        if (principal.role() == Role.EXTERNAL_FILER) {
            User filer = userRepository.findById(principal.userId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + principal.userId()));
            document.setSourceSystem(SOURCE_BIKA_FILING_SYSTEM);
            document.setExternalFilerName(filer.getFullName());
            document.setExternalFilerEmail(filer.getEmail());
        }

        Document saved = documentRepository.save(document);
        auditService.record(principal.userId(), targetCompanyId, "DOCUMENT", saved.getId().toString(), "CREATE_DOCUMENT", null, saved.getDocumentNumber());
        return toResponse(saved);
    }

    @Transactional
    public DocumentResponse update(AuthenticatedPrincipal principal, UUID id, UpdateDocumentRequest request) {
        Document document = getScopedOrThrow(principal, id);
        UUID companyId = document.getCompany().getId();

        DocumentType type = request.typeId() != null
                ? documentTypeService.getScopedForCompanyOrThrow(companyId, request.typeId())
                : null;

        String oldTitle = document.getTitle();
        document.setTitle(request.title());
        document.setType(type);
        document.setCustodian(request.custodian());
        document.setPages(request.pages());
        document.setArchivedDate(request.archivedDate());
        document.setNotes(request.notes());

        auditService.record(principal.userId(), companyId, "DOCUMENT", id.toString(), "UPDATE_DOCUMENT", oldTitle, request.title());
        return toResponse(document);
    }

    @Transactional
    public void delete(AuthenticatedPrincipal principal, UUID id) {
        Document document = getScopedOrThrow(principal, id);
        UUID companyId = document.getCompany().getId();
        String number = document.getDocumentNumber();

        documentRepository.delete(document);
        auditService.record(principal.userId(), companyId, "DOCUMENT", id.toString(), "DELETE_DOCUMENT", number, null);
    }

    @Transactional
    public DocumentResponse updateStatus(AuthenticatedPrincipal principal, UUID id, UpdateDocumentStatusRequest request) {
        Document document = getScopedOrThrow(principal, id);
        String oldStatus = document.getStatus().name();
        document.setStatus(request.status());

        auditService.record(principal.userId(), document.getCompany().getId(), "DOCUMENT", id.toString(), "CHANGE_STATUS", oldStatus, request.status().name());
        return toResponse(document);
    }

    @Transactional
    public DocumentResponse updateLocation(AuthenticatedPrincipal principal, UUID id, UpdateDocumentLocationRequest request) {
        Document document = getScopedOrThrow(principal, id);
        UUID companyId = document.getCompany().getId();

        String oldLabel = document.getBoxLocation() != null ? document.getBoxLocation().getName() : "unassigned";
        LocationNode newLocation = request.boxLocationId() != null
                ? resolveBoxLocation(companyId, request.boxLocationId())
                : null;
        document.setBoxLocation(newLocation);
        String newLabel = newLocation != null ? newLocation.getName() : "unassigned";

        auditService.record(principal.userId(), companyId, "DOCUMENT", id.toString(), "MOVE_DOCUMENT", oldLabel, newLabel);
        return toResponse(document);
    }

    private String resolveDocumentNumber(UUID companyId, String requested) {
        if (requested != null && !requested.isBlank()) {
            String normalized = requested.toUpperCase().trim();
            if (documentRepository.existsByCompanyIdAndDocumentNumberIgnoreCase(companyId, normalized)) {
                throw new DuplicateResourceException("Document number '" + normalized + "' already exists");
            }
            return normalized;
        }
        return generateDocumentNumber(companyId);
    }

    private String generateDocumentNumber(UUID companyId) {
        int year = LocalDate.now().getYear();
        String prefix = "DOC-" + year + "-";
        long existingCount = documentRepository.countByCompanyIdAndDocumentNumberStartingWith(companyId, prefix);

        int next = (int) existingCount + 1;
        String candidate;
        do {
            candidate = prefix + String.format("%04d", next);
            next++;
        } while (documentRepository.existsByCompanyIdAndDocumentNumberIgnoreCase(companyId, candidate));

        return candidate;
    }

    private LocationNode resolveBoxLocation(UUID companyId, UUID boxLocationId) {
        LocationNode node = locationNodeRepository.findById(boxLocationId)
                .orElseThrow(() -> new ResourceNotFoundException("Location not found: " + boxLocationId));

        // A box inside a shared warehouse (node.company == null) is usable by any company's
        // documents; a box inside an exclusive warehouse must match the document's own company.
        UUID nodeCompanyId = node.getCompany() != null ? node.getCompany().getId() : null;
        if (nodeCompanyId != null && !nodeCompanyId.equals(companyId)) {
            throw new ResourceNotFoundException("Location not found: " + boxLocationId);
        }
        if (!node.isStorageUnit()) {
            throw new IllegalArgumentException(
                    "\"" + node.getName() + "\" (" + node.getNodeType() + ") is not marked as a storage location");
        }
        return node;
    }

    private void trackRecentlyAccessed(UUID userId, Document document) {
        RecentlyAccessed entry = recentlyAccessedRepository.findByUserIdAndDocumentId(userId, document.getId())
                .orElseGet(() -> {
                    RecentlyAccessed created = new RecentlyAccessed();
                    created.setUser(userRepository.getReferenceById(userId));
                    created.setDocument(document);
                    return created;
                });
        entry.setAccessedAt(Instant.now());
        recentlyAccessedRepository.save(entry);
    }

    /** Package-visible so DashboardService can hydrate DocumentResponses without duplicating this mapping. */
    DocumentResponse toResponse(Document document) {
        LocationPathResponse location = document.getBoxLocation() != null
                ? locationNodeService.resolvePathForNode(document.getBoxLocation())
                : null;

        return new DocumentResponse(
                document.getId(),
                document.getCompany().getId(),
                document.getCompany().getName(),
                document.getDocumentNumber(),
                document.getTitle(),
                document.getType() != null ? document.getType().getId() : null,
                document.getType() != null ? document.getType().getName() : null,
                document.getStatus(),
                document.getCustodian(),
                document.getPages(),
                document.getArchivedDate(),
                document.getNotes(),
                document.getBoxLocation() != null ? document.getBoxLocation().getId() : null,
                location,
                document.getCreatedAt(),
                document.getSourceSystem(),
                document.getExternalReference(),
                document.getExternalFilerName(),
                document.getExternalFilerEmail(),
                document.getCompany().getSourceSystemId()
        );
    }

    private Document getScopedOrThrow(AuthenticatedPrincipal principal, UUID id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + id));

        if (!principal.isSuperAdmin() && !document.getCompany().getId().equals(principal.companyId())) {
            throw new ResourceNotFoundException("Document not found: " + id);
        }
        return document;
    }
}
