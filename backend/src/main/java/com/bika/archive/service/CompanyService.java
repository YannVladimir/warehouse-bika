package com.bika.archive.service;

import com.bika.archive.domain.entity.Company;
import com.bika.archive.dto.request.CreateCompanyRequest;
import com.bika.archive.dto.request.UpdateCompanyRequest;
import com.bika.archive.dto.response.CompanyResponse;
import com.bika.archive.exception.DuplicateResourceException;
import com.bika.archive.exception.ResourceNotFoundException;
import com.bika.archive.mapper.CompanyMapper;
import com.bika.archive.repository.CompanyRepository;
import com.bika.archive.security.AuthenticatedPrincipal;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final CompanyMapper companyMapper;
    private final AuditService auditService;

    public List<CompanyResponse> findAll() {
        return companyRepository.findAll().stream().map(companyMapper::toResponse).toList();
    }

    public CompanyResponse findById(UUID id) {
        return companyMapper.toResponse(getOrThrow(id));
    }

    @Transactional
    public CompanyResponse create(AuthenticatedPrincipal principal, CreateCompanyRequest request) {
        if (companyRepository.existsByNameIgnoreCase(request.name())) {
            throw new DuplicateResourceException("A company named '" + request.name() + "' already exists");
        }

        Company company = new Company();
        company.setName(request.name());
        company.setEmail(request.email());
        company.setPhone(request.phone());
        company.setIndustry(request.industry());
        company.setActive(true);

        Company saved = companyRepository.save(company);
        auditService.record(principal.userId(), saved.getId(), "COMPANY", saved.getId().toString(), "CREATE_COMPANY", null, saved.getName());
        return companyMapper.toResponse(saved);
    }

    @Transactional
    public CompanyResponse update(AuthenticatedPrincipal principal, UUID id, UpdateCompanyRequest request) {
        Company company = getOrThrow(id);
        requireNotSourceManaged(company);

        if (!company.getName().equalsIgnoreCase(request.name()) && companyRepository.existsByNameIgnoreCase(request.name())) {
            throw new DuplicateResourceException("A company named '" + request.name() + "' already exists");
        }

        String oldName = company.getName();
        company.setName(request.name());
        company.setEmail(request.email());
        company.setPhone(request.phone());
        company.setIndustry(request.industry());
        company.setActive(request.active());

        auditService.record(principal.userId(), id, "COMPANY", id.toString(), "UPDATE_COMPANY", oldName, request.name());
        return companyMapper.toResponse(company);
    }

    @Transactional
    public void delete(AuthenticatedPrincipal principal, UUID id) {
        Company company = getOrThrow(id);
        requireNotSourceManaged(company);
        String name = company.getName();

        companyRepository.delete(company);
        auditService.record(principal.userId(), id, "COMPANY", id.toString(), "DELETE_COMPANY", name, null);
    }

    private Company getOrThrow(UUID id) {
        return companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found: " + id));
    }

    private void requireNotSourceManaged(Company company) {
        if (company.getSourceSystemId() != null) {
            throw new IllegalArgumentException(
                    "This company is managed by an external system and can't be edited here");
        }
    }
}
