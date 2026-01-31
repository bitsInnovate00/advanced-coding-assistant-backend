package com.telekom.ai4coding.chatbot.controller;

import com.telekom.ai4coding.chatbot.dto.IndexRepositoryRequest;
import com.telekom.ai4coding.chatbot.dto.IndexRepositoryResponse;
import com.telekom.ai4coding.chatbot.dto.RepositoryStatusResponse;
import com.telekom.ai4coding.chatbot.service.VSCodeRepositoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for VS Code extension repository operations.
 * Provides endpoints for indexing, status checking, reindexing, and deleting repositories.
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/repositories")
@Tag(name = "VS Code Repository API", description = "Endpoints for VS Code extension repository management")
public class VSCodeRepositoryController {

    private final VSCodeRepositoryService vsCodeRepositoryService;

    /**
     * Index a new repository from the given path.
     *
     * @param request the index repository request containing the repository path
     * @return the index repository response with status and repoId
     */
    @Operation(
            summary = "Index a repository",
            description = "Indexes a local repository from the specified path for code analysis and search capabilities"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "201",
                    description = "Repository indexing started successfully",
                    content = @Content(schema = @Schema(implementation = IndexRepositoryResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid request - missing or invalid repository path",
                    content = @Content(schema = @Schema(implementation = IndexRepositoryResponse.class))
            ),
            @ApiResponse(
                    responseCode = "429",
                    description = "Rate limit exceeded"
            )
    })
    @PostMapping("/index")
    public ResponseEntity<IndexRepositoryResponse> indexRepository(
            @Valid @RequestBody IndexRepositoryRequest request) {
        log.info("Received request to index repository at path: {}", request.getRepositoryPath());
        
        IndexRepositoryResponse response = vsCodeRepositoryService.indexRepository(request);
        
        if ("FAILED".equals(response.getStatus())) {
            return ResponseEntity.badRequest().body(response);
        }
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get the status of a repository by its ID.
     *
     * @param repoId the repository ID
     * @return the repository status response
     */
    @Operation(
            summary = "Get repository status",
            description = "Retrieves the current indexing status and metadata of a repository"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Repository status retrieved successfully",
                    content = @Content(schema = @Schema(implementation = RepositoryStatusResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Repository not found",
                    content = @Content(schema = @Schema(implementation = RepositoryStatusResponse.class))
            ),
            @ApiResponse(
                    responseCode = "429",
                    description = "Rate limit exceeded"
            )
    })
    @GetMapping("/{repoId}/status")
    public ResponseEntity<RepositoryStatusResponse> getRepositoryStatus(
            @Parameter(description = "The unique identifier of the repository")
            @PathVariable String repoId) {
        log.info("Received request to get status for repository: {}", repoId);
        
        RepositoryStatusResponse response = vsCodeRepositoryService.getRepositoryStatus(repoId);
        
        if (response.getStatus() == RepositoryStatusResponse.RepositoryStatus.NOT_FOUND) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * Reindex an existing repository by its ID.
     *
     * @param repoId the repository ID
     * @return the index repository response with updated status
     */
    @Operation(
            summary = "Reindex a repository",
            description = "Triggers a complete reindex of an existing repository, refreshing all indexed content"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Repository reindexing started successfully",
                    content = @Content(schema = @Schema(implementation = IndexRepositoryResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Repository not found",
                    content = @Content(schema = @Schema(implementation = IndexRepositoryResponse.class))
            ),
            @ApiResponse(
                    responseCode = "429",
                    description = "Rate limit exceeded"
            )
    })
    @PostMapping("/{repoId}/reindex")
    public ResponseEntity<IndexRepositoryResponse> reindexRepository(
            @Parameter(description = "The unique identifier of the repository")
            @PathVariable String repoId) {
        log.info("Received request to reindex repository: {}", repoId);
        
        IndexRepositoryResponse response = vsCodeRepositoryService.reindexRepository(repoId);
        
        if ("FAILED".equals(response.getStatus()) && 
            response.getMessage() != null && response.getMessage().contains("not found")) {
            return ResponseEntity.notFound().build();
        }
        
        if ("FAILED".equals(response.getStatus())) {
            return ResponseEntity.badRequest().body(response);
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * Delete a repository by its ID.
     *
     * @param repoId the repository ID
     * @return no content if successful, not found otherwise
     */
    @Operation(
            summary = "Delete a repository",
            description = "Removes a repository and all its indexed data from the system"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "204",
                    description = "Repository deleted successfully"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Repository not found"
            ),
            @ApiResponse(
                    responseCode = "429",
                    description = "Rate limit exceeded"
            )
    })
    @DeleteMapping("/{repoId}")
    public ResponseEntity<Void> deleteRepository(
            @Parameter(description = "The unique identifier of the repository")
            @PathVariable String repoId) {
        log.info("Received request to delete repository: {}", repoId);
        
        boolean deleted = vsCodeRepositoryService.deleteRepository(repoId);
        
        if (!deleted) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.noContent().build();
    }

    /**
     * Get all indexed repositories.
     *
     * @return list of all repository statuses
     */
    @Operation(
            summary = "List all repositories",
            description = "Retrieves a list of all indexed repositories with their current status"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "List of repositories retrieved successfully",
                    content = @Content(schema = @Schema(implementation = RepositoryStatusResponse.class))
            ),
            @ApiResponse(
                    responseCode = "429",
                    description = "Rate limit exceeded"
            )
    })
    @GetMapping
    public ResponseEntity<List<RepositoryStatusResponse>> getAllRepositories() {
        log.info("Received request to list all repositories");
        
        List<RepositoryStatusResponse> repositories = vsCodeRepositoryService.getAllRepositories();
        return ResponseEntity.ok(repositories);
    }
}
