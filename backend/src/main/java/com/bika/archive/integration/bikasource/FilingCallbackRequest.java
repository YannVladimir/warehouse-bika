package com.bika.archive.integration.bikasource;

import java.util.UUID;

/**
 * Posted to the bika DMS's filing-callback endpoint after a document create attempt that carried
 * an externalReference -- tells them definitively whether the filing actually completed, since
 * generating a handoff link is not the same as the user finishing the Bika Archive form.
 */
public record FilingCallbackRequest(
        String externalReference,
        Long sourceCompanyId,
        String status,
        UUID bikaArchiveDocumentId,
        String bikaArchiveDocumentNumber,
        String failureReason
) {
    public static FilingCallbackRequest completed(String externalReference, Long sourceCompanyId, UUID documentId, String documentNumber) {
        return new FilingCallbackRequest(externalReference, sourceCompanyId, "COMPLETED", documentId, documentNumber, null);
    }

    public static FilingCallbackRequest failed(String externalReference, String failureReason) {
        return new FilingCallbackRequest(externalReference, null, "FAILED", null, null, failureReason);
    }
}
