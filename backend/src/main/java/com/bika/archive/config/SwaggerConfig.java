package com.bika.archive.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    private static final String BEARER_SCHEME_NAME = "bearerAuth";

    @Bean
    public OpenAPI bikaArchiveOpenAPI() {
        SecurityScheme bearerScheme = new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT");

        return new OpenAPI()
                .info(new Info()
                        .title("Bika Archive API")
                        .description("""
                                Multi-tenant warehouse document location management system: register where a \
                                physical document lives (warehouse -> a company-defined location hierarchy -> box) \
                                and search for it by number, title, or custodian.

                                Auth: POST /api/auth/login returns a short-lived JWT access token and sets an \
                                httpOnly refresh-token cookie. Send the access token as `Authorization: Bearer \
                                <token>` on every other request. When it expires, POST /api/auth/refresh (the \
                                cookie goes along automatically) for a new one -- refresh tokens rotate on every \
                                use, so the old one stops working immediately after.

                                Roles: SUPER_ADMIN (manages companies and shared facilities), COMPANY_ADMIN \
                                (manages their own company's users, warehouses, documents), USER (search and view \
                                only).""")
                        .version("v1"))
                .components(new Components().addSecuritySchemes(BEARER_SCHEME_NAME, bearerScheme))
                .addSecurityItem(new SecurityRequirement().addList(BEARER_SCHEME_NAME));
    }
}
