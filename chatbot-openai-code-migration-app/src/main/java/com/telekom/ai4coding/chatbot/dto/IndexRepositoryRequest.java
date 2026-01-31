package com.telekom.ai4coding.chatbot.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for indexing a repository via VS Code extension.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IndexRepositoryRequest {

    @NotBlank(message = "Repository path is required")
    @Size(max = 4096, message = "Repository path must not exceed 4096 characters")
    private String repositoryPath;

    @Size(max = 255, message = "Repository name must not exceed 255 characters")
    private String repositoryName;

    @Size(max = 50, message = "Branch name must not exceed 50 characters")
    private String branch;
}
