package com.telekom.ai4coding.chatbot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Response DTO for repository indexing operations.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IndexRepositoryResponse {

    private String repoId;
    private String repositoryPath;
    private String repositoryName;
    private String status;
    private String message;
    private Instant timestamp;
}
