package com.bika.archive.service;

import com.bika.archive.domain.entity.AuditLog;
import com.bika.archive.dto.response.AuditLogResponse;
import com.bika.archive.dto.response.PageResponse;
import com.bika.archive.mapper.AuditLogMapper;
import com.bika.archive.repository.AuditLogRepository;
import com.bika.archive.security.AuthenticatedPrincipal;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final AuditLogMapper auditLogMapper;

    @Transactional(readOnly = true)
    public PageResponse<AuditLogResponse> search(AuthenticatedPrincipal principal, String entityType, Pageable pageable) {
        UUID companyId = principal.isSuperAdmin() ? null : principal.companyId();
        Page<AuditLog> page = auditLogRepository.search(
                companyId, entityType, PageRequest.of(pageable.getPageNumber(), pageable.getPageSize())
        );
        return PageResponse.from(page.map(auditLogMapper::toResponse));
    }
}
