package com.telekom.ai4coding.chatbot.configuration;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Rate limiting filter using Bucket4j.
 * Limits requests per IP address for API endpoints.
 * Includes automatic cleanup of stale buckets to prevent memory leaks.
 */
@Slf4j
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private final Map<String, BucketWithTimestamp> buckets = new ConcurrentHashMap<>();
    private ScheduledExecutorService cleanupExecutor;

    @Value("${rate.limit.requests-per-minute:60}")
    private int requestsPerMinute;

    @Value("${rate.limit.enabled:true}")
    private boolean rateLimitEnabled;

    @Value("${rate.limit.bucket-expiry-minutes:10}")
    private int bucketExpiryMinutes;

    @Value("${rate.limit.max-buckets:10000}")
    private int maxBuckets;

    @PostConstruct
    public void init() {
        // Schedule cleanup task every 5 minutes
        cleanupExecutor = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread thread = new Thread(r, "rate-limit-cleanup");
            thread.setDaemon(true);
            return thread;
        });
        cleanupExecutor.scheduleAtFixedRate(this::cleanupStaleBuckets, 5, 5, TimeUnit.MINUTES);
    }

    @PreDestroy
    public void destroy() {
        if (cleanupExecutor != null) {
            cleanupExecutor.shutdown();
        }
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        
        // Only apply rate limiting to /api/v1/ endpoints
        String path = request.getRequestURI();
        if (!rateLimitEnabled || !path.startsWith("/api/v1/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = getClientIp(request);
        
        // Check if we've exceeded max buckets
        if (buckets.size() >= maxBuckets && !buckets.containsKey(clientIp)) {
            log.warn("Max rate limit buckets exceeded, cleaning up stale entries");
            cleanupStaleBuckets();
        }

        BucketWithTimestamp bucketWithTimestamp = buckets.computeIfAbsent(clientIp, this::createNewBucket);
        bucketWithTimestamp.updateLastAccess();

        if (bucketWithTimestamp.getBucket().tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            log.warn("Rate limit exceeded for IP: {}", clientIp);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Rate limit exceeded. Please try again later.\", \"retryAfterSeconds\": 60}");
        }
    }

    private BucketWithTimestamp createNewBucket(String key) {
        Bandwidth limit = Bandwidth.classic(requestsPerMinute, Refill.greedy(requestsPerMinute, Duration.ofMinutes(1)));
        Bucket bucket = Bucket.builder()
                .addLimit(limit)
                .build();
        return new BucketWithTimestamp(bucket);
    }

    private void cleanupStaleBuckets() {
        Instant expiryThreshold = Instant.now().minus(Duration.ofMinutes(bucketExpiryMinutes));
        int removedCount = 0;
        
        var iterator = buckets.entrySet().iterator();
        while (iterator.hasNext()) {
            var entry = iterator.next();
            if (entry.getValue().getLastAccess().isBefore(expiryThreshold)) {
                iterator.remove();
                removedCount++;
            }
        }
        
        if (removedCount > 0) {
            log.debug("Cleaned up {} stale rate limit buckets", removedCount);
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    /**
     * Wrapper class to track bucket with last access time.
     */
    private static class BucketWithTimestamp {
        private final Bucket bucket;
        private volatile Instant lastAccess;

        BucketWithTimestamp(Bucket bucket) {
            this.bucket = bucket;
            this.lastAccess = Instant.now();
        }

        Bucket getBucket() {
            return bucket;
        }

        Instant getLastAccess() {
            return lastAccess;
        }

        void updateLastAccess() {
            this.lastAccess = Instant.now();
        }
    }
}
