package com.bika.archive.integration.bikasource;

import com.bika.archive.config.BikaSourceIntegrationProperties;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

/**
 * Best-effort outbound notification to the bika DMS after a document create attempt that carried
 * an externalReference: tells them whether it actually completed or failed. Single attempt, no
 * retry queue -- a failed callback is logged and swallowed, matching the same house style as
 * EmailService and CompanySyncService (an external system's flakiness never breaks our own
 * request/response to the browser).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FilingCallbackService {

    private static final String CALLBACK_PATH = "/v1/archive-integration/filing-callback";

    private final BikaSourceIntegrationProperties properties;

    public void notifyCompleted(String externalReference, Long sourceCompanyId, UUID documentId, String documentNumber) {
        send(FilingCallbackRequest.completed(externalReference, sourceCompanyId, documentId, documentNumber));
    }

    public void notifyFailed(String externalReference, String failureReason) {
        send(FilingCallbackRequest.failed(externalReference, failureReason));
    }

    private void send(FilingCallbackRequest request) {
        if (!properties.isEnabled() || request.externalReference() == null || request.externalReference().isBlank()) {
            return;
        }

        try {
            RestClient.builder()
                    .baseUrl(properties.getBaseUrl())
                    .defaultHeader("X-Integration-Api-Key", properties.getApiKey())
                    .build()
                    .post()
                    .uri(CALLBACK_PATH)
                    .body(request)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception ex) {
            log.warn("Failed to notify bika source system of filing result for ref={}: {}",
                    request.externalReference(), ex.getMessage());
        }
    }
}
