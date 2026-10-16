package com.bika.archive.security.jwt;

public record HandoffClaims(
        String email,
        Long sourceCompanyId,
        String documentRef,
        String documentTitle,
        String custodian
) {
}
