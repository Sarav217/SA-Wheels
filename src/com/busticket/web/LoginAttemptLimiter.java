package com.busticket.web;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Temporarily blocks a username after too many failed login attempts.
 *
 * Kept in memory, so it resets when Tomcat restarts. That is enough to slow
 * down password guessing in a college-project deployment.
 */
final class LoginAttemptLimiter {

    private static final int MAX_FAILURES = 5;
    private static final long LOCK_MILLIS = 2 * 60 * 1000L;
    private static final int MAX_TRACKED = 1000;

    private final Map<String, Attempts> attempts = new ConcurrentHashMap<>();

    private static final class Attempts {
        private int failures;
        private long lastFailure;
    }

    /** True while the username is locked after repeated failures. */
    boolean isLocked(String username) {
        Attempts entry = attempts.get(key(username));
        if (entry == null) {
            return false;
        }
        synchronized (entry) {
            if (System.currentTimeMillis() - entry.lastFailure > LOCK_MILLIS) {
                attempts.remove(key(username));
                return false;
            }
            return entry.failures >= MAX_FAILURES;
        }
    }

    /** Record a failed attempt for the username. */
    void recordFailure(String username) {
        if (attempts.size() > MAX_TRACKED) {
            long now = System.currentTimeMillis();
            attempts.values().removeIf(entry -> now - entry.lastFailure > LOCK_MILLIS);
        }
        Attempts entry = attempts.computeIfAbsent(key(username), ignored -> new Attempts());
        synchronized (entry) {
            entry.failures++;
            entry.lastFailure = System.currentTimeMillis();
        }
    }

    /** Clear the failures after a successful login. */
    void reset(String username) {
        attempts.remove(key(username));
    }

    private String key(String username) {
        return username == null ? "" : username.trim().toLowerCase();
    }
}
