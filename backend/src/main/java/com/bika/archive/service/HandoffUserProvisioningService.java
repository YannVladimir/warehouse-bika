package com.bika.archive.service;

import com.bika.archive.domain.entity.Company;
import com.bika.archive.domain.entity.User;
import com.bika.archive.domain.enums.Role;
import com.bika.archive.repository.UserRepository;
import java.security.SecureRandom;
import java.util.Base64;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Runs in its own committed transaction (REQUIRES_NEW), separate from AuthService.exchangeHandoff's
 * transaction -- a freshly created user must actually be committed before AuditService.record (which
 * also runs REQUIRES_NEW, on its own connection) tries to insert an audit row referencing it, or the
 * foreign key check fails against a row that, from that connection's view, doesn't exist yet.
 */
@Service
@RequiredArgsConstructor
public class HandoffUserProvisioningService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public User createHandoffUser(Company company, String email, String fullName) {
        User user = new User();
        user.setEmail(email);
        user.setFullName(fullName);
        user.setCompany(company);
        user.setRole(Role.EXTERNAL_FILER);
        user.setActive(true);

        byte[] randomBytes = new byte[32];
        SECURE_RANDOM.nextBytes(randomBytes);
        user.setPasswordHash(passwordEncoder.encode(Base64.getEncoder().encodeToString(randomBytes)));

        return userRepository.save(user);
    }
}
