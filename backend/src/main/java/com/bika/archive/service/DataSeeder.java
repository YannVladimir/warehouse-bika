package com.bika.archive.service;

import com.bika.archive.config.BootstrapAdminProperties;
import com.bika.archive.domain.entity.User;
import com.bika.archive.domain.enums.Role;
import com.bika.archive.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final BootstrapAdminProperties bootstrapAdminProperties;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return;
        }

        User admin = new User();
        admin.setEmail(bootstrapAdminProperties.getEmail());
        admin.setFullName(bootstrapAdminProperties.getFullName());
        admin.setPasswordHash(passwordEncoder.encode(bootstrapAdminProperties.getPassword()));
        admin.setRole(Role.SUPER_ADMIN);
        admin.setActive(true);
        admin.setCompany(null);
        userRepository.save(admin);

        log.warn("Bootstrap SUPER_ADMIN created: {} -- change this password immediately.", admin.getEmail());
    }
}
