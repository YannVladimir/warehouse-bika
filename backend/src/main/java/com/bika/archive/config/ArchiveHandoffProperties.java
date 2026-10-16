package com.bika.archive.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.handoff")
public class ArchiveHandoffProperties {

    private String secret;
}
