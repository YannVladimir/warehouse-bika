package com.bika.archive.service;

import com.bika.archive.domain.entity.AuditLog;
import com.bika.archive.repository.AuditLogRepository;
import com.bika.archive.repository.CompanyRepository;
import com.bika.archive.repository.UserRepository;
import com.bika.archive.security.ClientIpResolver;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Audit writes run in their own transaction (REQUIRES_NEW) so a record survives even when the
 * surrounding business transaction rolls back -- e.g. a failed login attempt must stay logged
 * even though the login() method itself throws right after recording it.
 */
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final ClientIpResolver clientIpResolver;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(
            UUID actorUserId,
            UUID companyId,
            String entityType,
            String entityId,
            String action,
            String oldValue,
            String newValue
    ) {
        AuditLog log = new AuditLog();
        if (actorUserId != null) {
            log.setUser(userRepository.getReferenceById(actorUserId));
        }
        if (companyId != null) {
            log.setCompany(companyRepository.getReferenceById(companyId));
        }
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setAction(action);
        log.setOldValue(oldValue);
        log.setNewValue(newValue);
        log.setIpAddress(clientIpResolver.resolveIp());

        auditLogRepository.save(log);
    }
}
