package com.bika.archive.dto.response;

import com.bika.archive.security.jwt.HandoffClaims;

public record HandoffResponse(
        String accessToken,
        String tokenType,
        long expiresInSeconds,
        UserResponse user,
        String documentRef,
        String documentTitle,
        String custodian
) {
    public static HandoffResponse from(AuthResponse auth, HandoffClaims claims) {
        return new HandoffResponse(
                auth.accessToken(), auth.tokenType(), auth.expiresInSeconds(), auth.user(),
                claims.documentRef(), claims.documentTitle(), claims.custodian()
        );
    }
}
