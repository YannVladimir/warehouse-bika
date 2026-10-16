package com.bika.archive.security.jwt;

import com.bika.archive.config.ArchiveHandoffProperties;
import com.bika.archive.exception.InvalidCredentialsException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import javax.crypto.SecretKey;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Verifies short-lived handoff tokens minted by the bika DMS to hand a logged-in user straight
 * into this app's "add document" flow. Signed with its own secret (app.handoff.secret) --
 * deliberately NOT the same key as JwtService's session tokens, so a leak of one can't be used
 * to forge the other.
 */
@Component
@RequiredArgsConstructor
public class ArchiveHandoffTokenService {

    private static final String EXPECTED_TYPE = "bika-archive-handoff";

    private final ArchiveHandoffProperties properties;

    public HandoffClaims verify(String token) {
        if (properties.getSecret() == null || properties.getSecret().isBlank()) {
            throw new InvalidCredentialsException("Handoff is not configured on this server");
        }

        SecretKey signingKey = Keys.hmacShaKeyFor(properties.getSecret().getBytes(StandardCharsets.UTF_8));

        Claims claims;
        try {
            Jws<Claims> jws = Jwts.parser().verifyWith(signingKey).build().parseSignedClaims(token);
            claims = jws.getPayload();
        } catch (JwtException | IllegalArgumentException ex) {
            throw new InvalidCredentialsException("Invalid or expired handoff link");
        }

        if (!EXPECTED_TYPE.equals(claims.get("type", String.class))) {
            throw new InvalidCredentialsException("Invalid handoff link");
        }

        String email = claims.get("email", String.class);
        Number sourceCompanyId = claims.get("sourceCompanyId", Number.class);
        if (email == null || email.isBlank() || sourceCompanyId == null) {
            throw new InvalidCredentialsException("Invalid handoff link");
        }

        String documentRef = claims.get("documentRef", String.class);
        String documentTitle = claims.get("documentTitle", String.class);
        String custodian = claims.get("custodian", String.class);
        return new HandoffClaims(email, sourceCompanyId.longValue(), documentRef, documentTitle, custodian);
    }
}
