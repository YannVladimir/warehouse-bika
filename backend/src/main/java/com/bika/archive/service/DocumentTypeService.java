package com.bika.archive.service;

import com.bika.archive.domain.entity.Company;
import com.bika.archive.domain.entity.DocumentType;
import com.bika.archive.dto.request.CreateDocumentTypeRequest;
import com.bika.archive.dto.request.UpdateDocumentTypeRequest;
import com.bika.archive.dto.response.DocumentTypeResponse;
import com.bika.archive.exception.DuplicateResourceException;
import com.bika.archive.exception.ResourceNotFoundException;
import com.bika.archive.mapper.DocumentTypeMapper;
import com.bika.archive.repository.CompanyRepository;
import com.bika.archive.repository.DocumentTypeRepository;
import com.bika.archive.security.AuthenticatedPrincipal;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DocumentTypeService {

    private final DocumentTypeRepository documentTypeRepository;
    private final CompanyRepository companyRepository;
    private final DocumentTypeMapper documentTypeMapper;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<DocumentTypeResponse> findAll(AuthenticatedPrincipal principal) {
        List<DocumentType> types = principal.isSuperAdmin()
                ? documentTypeRepository.findAll()
                : documentTypeRepository.findByCompanyId(principal.companyId());
        return types.stream().map(documentTypeMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public DocumentTypeResponse findById(AuthenticatedPrincipal principal, UUID id) {
        return documentTypeMapper.toResponse(getScopedOrThrow(principal, id));
    }

    @Transactional
    public DocumentTypeResponse create(AuthenticatedPrincipal principal, CreateDocumentTypeRequest request) {
        UUID targetCompanyId = principal.isSuperAdmin() ? request.companyId() : principal.companyId();
        if (targetCompanyId == null) {
            throw new IllegalArgumentException("A company must be specified");
        }

        Company company = companyRepository.findById(targetCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found: " + targetCompanyId));

        if (documentTypeRepository.existsByCompanyIdAndNameIgnoreCase(targetCompanyId, request.name())) {
            throw new DuplicateResourceException("A document type named '" + request.name() + "' already exists for this company");
        }

        DocumentType type = new DocumentType();
        type.setCompany(company);
        type.setName(request.name());
        type.setDescription(request.description());

        DocumentType saved = documentTypeRepository.save(type);
        auditService.record(principal.userId(), targetCompanyId, "DOCUMENT_TYPE", saved.getId().toString(), "CREATE_DOCUMENT_TYPE", null, saved.getName());
        return documentTypeMapper.toResponse(saved);
    }

    @Transactional
    public DocumentTypeResponse update(AuthenticatedPrincipal principal, UUID id, UpdateDocumentTypeRequest request) {
        DocumentType type = getScopedOrThrow(principal, id);
        UUID companyId = type.getCompany().getId();

        if (!type.getName().equalsIgnoreCase(request.name())
                && documentTypeRepository.existsByCompanyIdAndNameIgnoreCase(companyId, request.name())) {
            throw new DuplicateResourceException("A document type named '" + request.name() + "' already exists for this company");
        }

        String oldName = type.getName();
        type.setName(request.name());
        type.setDescription(request.description());

        auditService.record(principal.userId(), companyId, "DOCUMENT_TYPE", id.toString(), "UPDATE_DOCUMENT_TYPE", oldName, request.name());
        return documentTypeMapper.toResponse(type);
    }

    @Transactional
    public void delete(AuthenticatedPrincipal principal, UUID id) {
        DocumentType type = getScopedOrThrow(principal, id);
        UUID companyId = type.getCompany().getId();
        String name = type.getName();

        documentTypeRepository.delete(type);
        auditService.record(principal.userId(), companyId, "DOCUMENT_TYPE", id.toString(), "DELETE_DOCUMENT_TYPE", name, null);
    }

    private DocumentType getScopedOrThrow(AuthenticatedPrincipal principal, UUID id) {
        DocumentType type = documentTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document type not found: " + id));

        if (!principal.isSuperAdmin() && !type.getCompany().getId().equals(principal.companyId())) {
            throw new ResourceNotFoundException("Document type not found: " + id);
        }
        return type;
    }

    /**
     * Used by DocumentService when assigning a type to a document being created/edited for a
     * specific (already-resolved) company -- always enforces that exact company match, regardless
     * of the caller's role, since even a SUPER_ADMIN must not attach another tenant's type.
     */
    public DocumentType getScopedForCompanyOrThrow(UUID companyId, UUID id) {
        DocumentType type = documentTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document type not found: " + id));

        if (!type.getCompany().getId().equals(companyId)) {
            throw new ResourceNotFoundException("Document type not found: " + id);
        }
        return type;
    }
}
