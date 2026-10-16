package com.bika.archive.config;

import com.fasterxml.jackson.databind.module.SimpleModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JacksonConfig {

    // Spring Boot's Jackson autoconfiguration picks up any Module bean and registers it with the
    // application's ObjectMapper automatically -- no manual wiring needed elsewhere.
    @Bean
    public SimpleModule trimmingStringModule() {
        SimpleModule module = new SimpleModule("TrimmingStringModule");
        module.addDeserializer(String.class, new TrimmingStringDeserializer());
        return module;
    }
}
