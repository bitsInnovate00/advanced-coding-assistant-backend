package com.telekom.ai4coding.chatbot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

/**
 * Response DTO for detailed health check endpoint.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DetailedHealthResponse {

    private HealthStatus status;
    private String version;
    private Instant timestamp;
    private Map<String, ComponentHealth> components;

    /**
     * Enum representing the overall health status.
     */
    public enum HealthStatus {
        UP,
        DOWN,
        DEGRADED
    }

    /**
     * DTO representing the health of an individual component.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ComponentHealth {
        private HealthStatus status;
        private String message;
        private Map<String, Object> details;
    }
}
