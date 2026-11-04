package com.bika.archive.security;

import com.bika.archive.exception.RateLimitExceededException;
import java.time.Duration;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RateLimitServiceTest {

    private final RateLimitService rateLimitService = new RateLimitService();

    @Test
    void allowsAttemptsUpToTheLimit() {
        String key = "login:" + java.util.UUID.randomUUID();
        for (int i = 0; i < 5; i++) {
            assertThatCode(() -> rateLimitService.checkAndRecord(key, 5, Duration.ofMinutes(15)))
                    .doesNotThrowAnyException();
        }
    }

    @Test
    void rejectsTheAttemptThatExceedsTheLimit() {
        String key = "login:" + java.util.UUID.randomUUID();
        for (int i = 0; i < 5; i++) {
            rateLimitService.checkAndRecord(key, 5, Duration.ofMinutes(15));
        }

        assertThatThrownBy(() -> rateLimitService.checkAndRecord(key, 5, Duration.ofMinutes(15)))
                .isInstanceOf(RateLimitExceededException.class);
    }

    @Test
    void tracksDifferentKeysIndependently() {
        // A brute-force lockout on one email/IP must not lock out a different one sharing the map.
        String keyA = "login:a-" + java.util.UUID.randomUUID();
        String keyB = "login:b-" + java.util.UUID.randomUUID();

        for (int i = 0; i < 5; i++) {
            rateLimitService.checkAndRecord(keyA, 5, Duration.ofMinutes(15));
        }

        assertThatCode(() -> rateLimitService.checkAndRecord(keyB, 5, Duration.ofMinutes(15)))
                .doesNotThrowAnyException();
    }

    @Test
    void resetsTheCountOnceTheWindowExpires() throws InterruptedException {
        String key = "login:" + java.util.UUID.randomUUID();
        Duration shortWindow = Duration.ofMillis(50);

        for (int i = 0; i < 3; i++) {
            rateLimitService.checkAndRecord(key, 3, shortWindow);
        }
        assertThatThrownBy(() -> rateLimitService.checkAndRecord(key, 3, shortWindow))
                .isInstanceOf(RateLimitExceededException.class);

        Thread.sleep(80);

        assertThatCode(() -> rateLimitService.checkAndRecord(key, 3, shortWindow))
                .doesNotThrowAnyException();
    }
}
