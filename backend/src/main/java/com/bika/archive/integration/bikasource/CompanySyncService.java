package com.bika.archive.integration.bikasource;

import com.bika.archive.config.BikaSourceIntegrationProperties;
import com.bika.archive.domain.entity.Company;
import com.bika.archive.repository.CompanyRepository;
import java.net.URI;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * Mirrors the bika DMS's companies into our local companies table (read-only copies, matched by
 * sourceSystemId). Their system is the source of truth for these rows -- CompanyService rejects
 * edits to any company with a non-null sourceSystemId.
 *
 * Triggered on demand (when a SUPER_ADMIN opens the Companies page) rather than on a schedule --
 * see CompanyController's /sync endpoint.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CompanySyncService {

    private static final DateTimeFormatter UPDATED_SINCE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    private final BikaSourceIntegrationProperties properties;
    private final CompanyRepository companyRepository;

    public void syncCompanies() {
        if (!properties.isEnabled()) {
            return;
        }

        RestClient restClient = RestClient.builder()
                .baseUrl(properties.getBaseUrl())
                .defaultHeader("X-Integration-Api-Key", properties.getApiKey())
                .build();

        Optional<String> updatedSince = companyRepository.findLatestSourceSystemSyncedAt()
                .map(UPDATED_SINCE_FORMAT::format);
        URI uri = UriComponentsBuilder.fromUriString(properties.getBaseUrl() + "/v1/companies/export")
                .queryParamIfPresent("updatedSince", updatedSince)
                .build()
                .toUri();

        List<ExternalCompanyDto> companies;
        try {
            companies = restClient.get()
                    .uri(uri)
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<ExternalCompanyDto>>() {
                    });
        } catch (Exception ex) {
            log.error("Company sync from bika source system failed", ex);
            return;
        }

        if (companies == null || companies.isEmpty()) {
            return;
        }

        int upserted = 0;
        for (ExternalCompanyDto dto : companies) {
            try {
                upsert(dto);
                upserted++;
            } catch (Exception ex) {
                log.warn("Skipping company sync row (sourceSystemId={}): {}", dto.id(), ex.getMessage());
            }
        }
        log.info("Company sync from bika source system: {}/{} rows applied", upserted, companies.size());
    }

    private void upsert(ExternalCompanyDto dto) {
        Company company = companyRepository.findBySourceSystemId(dto.id()).orElseGet(Company::new);
        company.setSourceSystemId(dto.id());
        company.setName(dto.name());
        company.setEmail(dto.email() != null && !dto.email().isBlank() ? dto.email() : dto.code() + "@unknown.local");
        company.setPhone(dto.phone());
        company.setActive(dto.active());
        company.setSourceSystemSyncedAt(dto.updatedAt());
        companyRepository.saveAndFlush(company);
    }
}
