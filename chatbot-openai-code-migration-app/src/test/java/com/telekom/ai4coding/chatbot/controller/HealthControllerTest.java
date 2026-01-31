package com.telekom.ai4coding.chatbot.controller;

import com.telekom.ai4coding.chatbot.dto.DetailedHealthResponse;
import com.telekom.ai4coding.chatbot.dto.DetailedHealthResponse.ComponentHealth;
import com.telekom.ai4coding.chatbot.dto.DetailedHealthResponse.HealthStatus;
import com.telekom.ai4coding.chatbot.service.HealthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = HealthController.class)
public class HealthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private HealthService healthService;

    private DetailedHealthResponse healthyResponse;

    @BeforeEach
    void setUp() {
        Map<String, ComponentHealth> components = new HashMap<>();
        
        components.put("neo4j", ComponentHealth.builder()
                .status(HealthStatus.UP)
                .message("Neo4j connection is healthy")
                .details(Map.of("database", "neo4j"))
                .build());
        
        components.put("jvm", ComponentHealth.builder()
                .status(HealthStatus.UP)
                .message("JVM is healthy")
                .details(Map.of("availableProcessors", 4))
                .build());
        
        components.put("disk", ComponentHealth.builder()
                .status(HealthStatus.UP)
                .message("Disk space is adequate")
                .details(Map.of("diskUsagePercent", "50.00%"))
                .build());

        healthyResponse = DetailedHealthResponse.builder()
                .status(HealthStatus.UP)
                .version("0.0.2-SNAPSHOT")
                .timestamp(Instant.now())
                .components(components)
                .build();
    }

    @Test
    void getDetailedHealth_WhenAllComponentsHealthy_ShouldReturnOkWithUpStatus() throws Exception {
        when(healthService.getDetailedHealth()).thenReturn(healthyResponse);

        mockMvc.perform(get("/api/v1/health/detailed")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.version").value("0.0.2-SNAPSHOT"))
                .andExpect(jsonPath("$.components.neo4j.status").value("UP"))
                .andExpect(jsonPath("$.components.jvm.status").value("UP"))
                .andExpect(jsonPath("$.components.disk.status").value("UP"));
    }

    @Test
    void getDetailedHealth_WhenDatabaseDown_ShouldReturnOkWithDownStatus() throws Exception {
        Map<String, ComponentHealth> components = new HashMap<>();
        
        components.put("neo4j", ComponentHealth.builder()
                .status(HealthStatus.DOWN)
                .message("Neo4j connection failed")
                .details(Map.of("error", "Connection refused"))
                .build());
        
        components.put("jvm", ComponentHealth.builder()
                .status(HealthStatus.UP)
                .message("JVM is healthy")
                .build());
        
        components.put("disk", ComponentHealth.builder()
                .status(HealthStatus.UP)
                .message("Disk space is adequate")
                .build());

        DetailedHealthResponse degradedResponse = DetailedHealthResponse.builder()
                .status(HealthStatus.DOWN)
                .version("0.0.2-SNAPSHOT")
                .timestamp(Instant.now())
                .components(components)
                .build();

        when(healthService.getDetailedHealth()).thenReturn(degradedResponse);

        mockMvc.perform(get("/api/v1/health/detailed")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DOWN"))
                .andExpect(jsonPath("$.components.neo4j.status").value("DOWN"))
                .andExpect(jsonPath("$.components.neo4j.message").value("Neo4j connection failed"));
    }

    @Test
    void getDetailedHealth_WhenDiskSpaceLow_ShouldReturnOkWithDegradedStatus() throws Exception {
        Map<String, ComponentHealth> components = new HashMap<>();
        
        components.put("neo4j", ComponentHealth.builder()
                .status(HealthStatus.UP)
                .message("Neo4j connection is healthy")
                .build());
        
        components.put("jvm", ComponentHealth.builder()
                .status(HealthStatus.UP)
                .message("JVM is healthy")
                .build());
        
        components.put("disk", ComponentHealth.builder()
                .status(HealthStatus.DEGRADED)
                .message("Warning: Low disk space")
                .details(Map.of("diskUsagePercent", "87.00%"))
                .build());

        DetailedHealthResponse degradedResponse = DetailedHealthResponse.builder()
                .status(HealthStatus.DEGRADED)
                .version("0.0.2-SNAPSHOT")
                .timestamp(Instant.now())
                .components(components)
                .build();

        when(healthService.getDetailedHealth()).thenReturn(degradedResponse);

        mockMvc.perform(get("/api/v1/health/detailed")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DEGRADED"))
                .andExpect(jsonPath("$.components.disk.status").value("DEGRADED"))
                .andExpect(jsonPath("$.components.disk.message").value("Warning: Low disk space"));
    }
}
