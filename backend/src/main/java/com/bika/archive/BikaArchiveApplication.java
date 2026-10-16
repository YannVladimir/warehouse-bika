package com.bika.archive;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

// Authentication is fully custom (manual login + JWT filter) -- no Spring Security
// UserDetailsService/AuthenticationManager is ever used, so its autoconfigured
// in-memory fallback (and the "generated security password" boot noise) is excluded.
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
@ConfigurationPropertiesScan
@EnableJpaAuditing
public class BikaArchiveApplication {

    public static void main(String[] args) {
        SpringApplication.run(BikaArchiveApplication.class, args);
    }
}
