package com.telekom.ai4coding.chatbot.controller;

import com.telekom.ai4coding.chatbot.dto.DetailedHealthResponse;
import com.telekom.ai4coding.chatbot.service.HealthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller for detailed health check endpoint.
 * Provides comprehensive health information about the application and its components.
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/health")
@Tag(name = "Health API", description = "Endpoints for application health monitoring")
public class HealthController {

    private final HealthService healthService;

    /**
     * Get detailed health information about the application and all its components.
     *
     * @return detailed health response with component statuses
     */
    @Operation(
            summary = "Get detailed health status",
            description = "Returns comprehensive health information including database connectivity, JVM metrics, and disk space"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Health information retrieved successfully",
                    content = @Content(schema = @Schema(implementation = DetailedHealthResponse.class))
            ),
            @ApiResponse(
                    responseCode = "429",
                    description = "Rate limit exceeded"
            )
    })
    @GetMapping("/detailed")
    public ResponseEntity<DetailedHealthResponse> getDetailedHealth() {
        log.debug("Received request for detailed health check");
        
        DetailedHealthResponse response = healthService.getDetailedHealth();
        return ResponseEntity.ok(response);
    }
}
