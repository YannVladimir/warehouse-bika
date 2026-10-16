package com.bika.archive.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.frontend")
public class FrontendProperties {

    /** Base URL used to build links in emails (e.g. the password reset link). */
    private String url;
}
