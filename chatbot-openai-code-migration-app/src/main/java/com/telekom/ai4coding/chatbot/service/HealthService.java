package com.telekom.ai4coding.chatbot.service;

import com.telekom.ai4coding.chatbot.dto.DetailedHealthResponse;
import com.telekom.ai4coding.chatbot.dto.DetailedHealthResponse.ComponentHealth;
import com.telekom.ai4coding.chatbot.dto.DetailedHealthResponse.HealthStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.neo4j.driver.Driver;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Service for providing detailed health information about the application.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class HealthService {

    private final Driver neo4jDriver;

    @Value("${spring.application.name:advanced-coding-assistant}")
    private String applicationName;

    @Value("${info.app.version:0.0.2-SNAPSHOT}")
    private String applicationVersion;

    /**
     * Get detailed health information about all components.
     *
     * @return detailed health response
     */
    public DetailedHealthResponse getDetailedHealth() {
        Map<String, ComponentHealth> components = new HashMap<>();
        HealthStatus overallStatus = HealthStatus.UP;

        // Check Neo4j health
        ComponentHealth neo4jHealth = checkNeo4jHealth();
        components.put("neo4j", neo4jHealth);
        if (neo4jHealth.getStatus() == HealthStatus.DOWN) {
            overallStatus = HealthStatus.DOWN;
        } else if (neo4jHealth.getStatus() == HealthStatus.DEGRADED && overallStatus == HealthStatus.UP) {
            overallStatus = HealthStatus.DEGRADED;
        }

        // Check JVM health
        ComponentHealth jvmHealth = checkJvmHealth();
        components.put("jvm", jvmHealth);

        // Check disk space
        ComponentHealth diskHealth = checkDiskHealth();
        components.put("disk", diskHealth);
        if (diskHealth.getStatus() == HealthStatus.DOWN) {
            overallStatus = HealthStatus.DOWN;
        } else if (diskHealth.getStatus() == HealthStatus.DEGRADED && overallStatus == HealthStatus.UP) {
            overallStatus = HealthStatus.DEGRADED;
        }

        return DetailedHealthResponse.builder()
                .status(overallStatus)
                .version(applicationVersion)
                .timestamp(Instant.now())
                .components(components)
                .build();
    }

    private ComponentHealth checkNeo4jHealth() {
        try {
            neo4jDriver.verifyConnectivity();
            
            Map<String, Object> details = new HashMap<>();
            details.put("database", "neo4j");
            
            return ComponentHealth.builder()
                    .status(HealthStatus.UP)
                    .message("Neo4j connection is healthy")
                    .details(details)
                    .build();

        } catch (Exception e) {
            log.warn("Neo4j health check failed", e);
            
            Map<String, Object> details = new HashMap<>();
            details.put("error", e.getMessage());
            
            return ComponentHealth.builder()
                    .status(HealthStatus.DOWN)
                    .message("Neo4j connection failed")
                    .details(details)
                    .build();
        }
    }

    private ComponentHealth checkJvmHealth() {
        Runtime runtime = Runtime.getRuntime();
        long maxMemory = runtime.maxMemory();
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long usedMemory = totalMemory - freeMemory;

        Map<String, Object> details = new HashMap<>();
        details.put("maxMemory", formatBytes(maxMemory));
        details.put("totalMemory", formatBytes(totalMemory));
        details.put("freeMemory", formatBytes(freeMemory));
        details.put("usedMemory", formatBytes(usedMemory));
        details.put("availableProcessors", runtime.availableProcessors());

        double memoryUsagePercent = (double) usedMemory / maxMemory * 100;
        details.put("memoryUsagePercent", String.format("%.2f%%", memoryUsagePercent));

        HealthStatus status = HealthStatus.UP;
        String message = "JVM is healthy";
        
        if (memoryUsagePercent > 90) {
            status = HealthStatus.DEGRADED;
            message = "High memory usage detected";
        }

        return ComponentHealth.builder()
                .status(status)
                .message(message)
                .details(details)
                .build();
    }

    private ComponentHealth checkDiskHealth() {
        java.io.File root = new java.io.File("/");
        long totalSpace = root.getTotalSpace();
        long freeSpace = root.getFreeSpace();
        long usableSpace = root.getUsableSpace();

        Map<String, Object> details = new HashMap<>();
        details.put("totalSpace", formatBytes(totalSpace));
        details.put("freeSpace", formatBytes(freeSpace));
        details.put("usableSpace", formatBytes(usableSpace));

        double diskUsagePercent = (double) (totalSpace - freeSpace) / totalSpace * 100;
        details.put("diskUsagePercent", String.format("%.2f%%", diskUsagePercent));

        HealthStatus status = HealthStatus.UP;
        String message = "Disk space is adequate";
        
        if (diskUsagePercent > 95) {
            status = HealthStatus.DOWN;
            message = "Critical: Very low disk space";
        } else if (diskUsagePercent > 85) {
            status = HealthStatus.DEGRADED;
            message = "Warning: Low disk space";
        }

        return ComponentHealth.builder()
                .status(status)
                .message(message)
                .details(details)
                .build();
    }

    private String formatBytes(long bytes) {
        if (bytes < 1024) return bytes + " B";
        int exp = (int) (Math.log(bytes) / Math.log(1024));
        String pre = "KMGTPE".charAt(exp - 1) + "";
        return String.format("%.2f %sB", bytes / Math.pow(1024, exp), pre);
    }
}
