package com.telekom.ai4coding.chatbot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Response DTO for repository status queries.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RepositoryStatusResponse {

    private String repoId;
    private String repositoryPath;
    private String repositoryName;
    private RepositoryStatus status;
    private Integer totalFiles;
    private Integer indexedFiles;
    private Instant lastIndexedAt;
    private String errorMessage;

    /**
     * Enum representing the possible statuses of a repository.
     */
    public enum RepositoryStatus {
        INDEXING,
        INDEXED,
        FAILED,
        NOT_FOUND
    }
}
