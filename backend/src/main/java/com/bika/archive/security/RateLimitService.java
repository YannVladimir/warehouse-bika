package com.bika.archive.security;

import com.bika.archive.exception.RateLimitExceededException;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

/**
 * A simple in-memory sliding-window-ish rate limiter (fixed window, reset on expiry). Deliberately
 * not backed by Redis or any external store -- this app runs as a single instance, so a
 * ConcurrentHashMap is the right amount of infrastructure for "stop brute-forcing /login", not a
 * distributed rate limiter nobody asked for.
 */
@Component
public class RateLimitService {

    private record Window(int count, Instant windowStart) {
    }

    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    /**
     * Throws if `key` has already been recorded `maxAttempts` times within `window`. Otherwise
     * records this attempt and lets the caller proceed.
     */
    public void checkAndRecord(String key, int maxAttempts, Duration window) {
        Instant now = Instant.now();

        windows.compute(key, (k, existing) -> {
            if (existing == null || existing.windowStart().plus(window).isBefore(now)) {
                return new Window(1, now);
            }
            if (existing.count() >= maxAttempts) {
                throw new RateLimitExceededException("Too many attempts. Please try again later.");
            }
            return new Window(existing.count() + 1, existing.windowStart());
        });
    }
}
