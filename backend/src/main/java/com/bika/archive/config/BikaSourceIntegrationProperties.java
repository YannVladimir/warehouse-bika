package com.bika.archive.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.integration.bika-source")
public class BikaSourceIntegrationProperties {

    private String baseUrl;
    private String apiKey;
    private boolean enabled;
}
