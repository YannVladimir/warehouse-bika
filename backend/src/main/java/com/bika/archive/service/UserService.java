package com.bika.archive.service;

import com.bika.archive.domain.entity.Company;
import com.bika.archive.domain.entity.User;
import com.bika.archive.domain.enums.Role;
import com.bika.archive.dto.request.CreateUserRequest;
import com.bika.archive.dto.request.UpdateUserRequest;
import com.bika.archive.dto.response.UserResponse;
import com.bika.archive.exception.DuplicateResourceException;
import com.bika.archive.exception.ResourceNotFoundException;
import com.bika.archive.mapper.UserMapper;
import com.bika.archive.repository.CompanyRepository;
import com.bika.archive.repository.UserRepository;
import com.bika.archive.security.AuthenticatedPrincipal;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<UserResponse> findAll(AuthenticatedPrincipal principal) {
        List<User> users = principal.isSuperAdmin()
                ? userRepository.findAll()
                : userRepository.findByCompanyId(principal.companyId());
        return users.stream().map(userMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public UserResponse findById(AuthenticatedPrincipal principal, UUID id) {
        return userMapper.toResponse(getScopedOrThrow(principal, id));
    }

    @Transactional
    public UserResponse create(AuthenticatedPrincipal principal, CreateUserRequest request) {
        if (!principal.isSuperAdmin() && request.role() == Role.SUPER_ADMIN) {
            throw new AccessDeniedException("Only a super admin can create another super admin");
        }
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new DuplicateResourceException("A user with email '" + request.email() + "' already exists");
        }

        UUID targetCompanyId = principal.isSuperAdmin() ? request.companyId() : principal.companyId();

        if (request.role() == Role.SUPER_ADMIN && targetCompanyId != null) {
            throw new IllegalArgumentException("A super admin cannot belong to a company");
        }
        if (request.role() != Role.SUPER_ADMIN && targetCompanyId == null) {
            throw new IllegalArgumentException("A company must be specified for this role");
        }

        Company company = null;
        if (targetCompanyId != null) {
            company = companyRepository.findById(targetCompanyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Company not found: " + targetCompanyId));
        }

        User user = new User();
        user.setEmail(request.email());
        user.setFullName(request.fullName());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(request.role());
        user.setCompany(company);
        user.setActive(true);

        User saved = userRepository.save(user);
        auditService.record(principal.userId(), targetCompanyId, "USER", saved.getId().toString(), "CREATE_USER", null, saved.getEmail());
        return userMapper.toResponse(saved);
    }

    @Transactional
    public UserResponse update(AuthenticatedPrincipal principal, UUID id, UpdateUserRequest request) {
        User user = getScopedOrThrow(principal, id);

        if (!principal.isSuperAdmin() && request.role() == Role.SUPER_ADMIN) {
            throw new AccessDeniedException("Only a super admin can assign the super admin role");
        }
        if (request.role() == Role.SUPER_ADMIN && user.getCompany() != null) {
            throw new IllegalArgumentException("A super admin cannot belong to a company");
        }
        if (request.role() != Role.SUPER_ADMIN && user.getCompany() == null) {
            throw new IllegalArgumentException("A company must be specified for this role");
        }

        String oldRole = user.getRole().name();
        user.setFullName(request.fullName());
        user.setRole(request.role());

        UUID companyId = user.getCompany() != null ? user.getCompany().getId() : null;
        auditService.record(principal.userId(), companyId, "USER", id.toString(), "UPDATE_USER", oldRole, request.role().name());
        return userMapper.toResponse(user);
    }

    @Transactional
    public void delete(AuthenticatedPrincipal principal, UUID id) {
        if (principal.userId().equals(id)) {
            throw new IllegalArgumentException("You cannot delete your own account");
        }
        User user = getScopedOrThrow(principal, id);
        UUID companyId = user.getCompany() != null ? user.getCompany().getId() : null;

        userRepository.delete(user);
        auditService.record(principal.userId(), companyId, "USER", id.toString(), "DELETE_USER", user.getEmail(), null);
    }

    @Transactional
    public UserResponse setActive(AuthenticatedPrincipal principal, UUID id, boolean active) {
        if (!active && principal.userId().equals(id)) {
            throw new IllegalArgumentException("You cannot deactivate your own account");
        }
        User user = getScopedOrThrow(principal, id);
        user.setActive(active);

        UUID companyId = user.getCompany() != null ? user.getCompany().getId() : null;
        auditService.record(principal.userId(), companyId, "USER", id.toString(), active ? "ACTIVATE_USER" : "DEACTIVATE_USER", null, null);
        return userMapper.toResponse(user);
    }

    private User getScopedOrThrow(AuthenticatedPrincipal principal, UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));

        if (!principal.isSuperAdmin()) {
            UUID userCompanyId = user.getCompany() != null ? user.getCompany().getId() : null;
            if (userCompanyId == null || !userCompanyId.equals(principal.companyId())) {
                // Hide cross-tenant existence: a 403 here would confirm the id belongs to someone else's tenant.
                throw new ResourceNotFoundException("User not found: " + id);
            }
        }
        return user;
    }
}
