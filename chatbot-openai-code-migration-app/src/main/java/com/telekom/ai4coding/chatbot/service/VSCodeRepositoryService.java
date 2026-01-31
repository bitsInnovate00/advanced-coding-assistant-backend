package com.telekom.ai4coding.chatbot.service;

import com.telekom.ai4coding.chatbot.dto.IndexRepositoryRequest;
import com.telekom.ai4coding.chatbot.dto.IndexRepositoryResponse;
import com.telekom.ai4coding.chatbot.dto.RepositoryStatusResponse;
import com.telekom.ai4coding.chatbot.dto.RepositoryStatusResponse.RepositoryStatus;
import com.telekom.ai4coding.chatbot.graph.FileNode;
import com.telekom.ai4coding.chatbot.graph.KnowledgeGraphBatchInsertService;
import com.telekom.ai4coding.chatbot.graph.KnowledgeGraphBuilder;
import com.telekom.ai4coding.chatbot.repository.FileNodeRepository;
import dev.langchain4j.model.embedding.EmbeddingModel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service for VS Code extension repository operations.
 * Handles indexing, status checking, reindexing, and deletion of repositories.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VSCodeRepositoryService {

    private final KnowledgeGraphBuilder knowledgeGraphBuilder;
    private final FileNodeRepository fileNodeRepository;
    private final KnowledgeGraphBatchInsertService knowledgeGraphBatchInsertService;
    private final EmbeddingModel embeddingModel;

    // In-memory store for repository metadata (in production, consider using a database)
    private final Map<String, RepositoryMetadata> repositoryStore = new ConcurrentHashMap<>();

    /**
     * Index a repository from the given path.
     *
     * @param request the index repository request
     * @return the index repository response
     */
    public IndexRepositoryResponse indexRepository(IndexRepositoryRequest request) {
        String repositoryPath = request.getRepositoryPath();
        Path directoryPath = Paths.get(repositoryPath);

        // Validate path exists and is a directory
        if (!Files.exists(directoryPath) || !Files.isDirectory(directoryPath)) {
            return IndexRepositoryResponse.builder()
                    .repositoryPath(repositoryPath)
                    .status("FAILED")
                    .message("Invalid path: Path does not exist or is not a directory")
                    .timestamp(Instant.now())
                    .build();
        }

        // Generate or retrieve repository ID based on path
        String repoId = generateRepoId(repositoryPath);
        String repositoryName = request.getRepositoryName() != null 
                ? request.getRepositoryName() 
                : directoryPath.getFileName().toString();

        try {
            log.info("Starting indexing for repository: {} at path: {}", repositoryName, repositoryPath);
            
            // Store metadata
            RepositoryMetadata metadata = new RepositoryMetadata(
                    repoId, repositoryPath, repositoryName, RepositoryStatus.INDEXING, Instant.now());
            repositoryStore.put(repoId, metadata);

            // Build and insert knowledge graph
            FileNode knowledgeGraph = knowledgeGraphBuilder.buildGraphFromDir(directoryPath.toFile()).getRootFileNode();
            knowledgeGraphBatchInsertService.batchInsertFileStructure(knowledgeGraph, embeddingModel.dimension());

            // Update metadata
            metadata.setStatus(RepositoryStatus.INDEXED);
            metadata.setLastIndexedAt(Instant.now());
            metadata.setTotalFiles(countFiles(directoryPath.toFile()));
            repositoryStore.put(repoId, metadata);

            log.info("Successfully indexed repository: {}", repositoryName);

            return IndexRepositoryResponse.builder()
                    .repoId(repoId)
                    .repositoryPath(repositoryPath)
                    .repositoryName(repositoryName)
                    .status("INDEXED")
                    .message("Repository indexed successfully")
                    .timestamp(Instant.now())
                    .build();

        } catch (Exception e) {
            log.error("Failed to index repository: {}", repositoryPath, e);
            
            // Update metadata with failure
            RepositoryMetadata metadata = repositoryStore.get(repoId);
            if (metadata != null) {
                metadata.setStatus(RepositoryStatus.FAILED);
                metadata.setErrorMessage(e.getMessage());
            }

            return IndexRepositoryResponse.builder()
                    .repoId(repoId)
                    .repositoryPath(repositoryPath)
                    .repositoryName(repositoryName)
                    .status("FAILED")
                    .message("Failed to index repository: " + e.getMessage())
                    .timestamp(Instant.now())
                    .build();
        }
    }

    /**
     * Get the status of a repository by its ID.
     *
     * @param repoId the repository ID
     * @return the repository status response
     */
    public RepositoryStatusResponse getRepositoryStatus(String repoId) {
        RepositoryMetadata metadata = repositoryStore.get(repoId);

        if (metadata == null) {
            return RepositoryStatusResponse.builder()
                    .repoId(repoId)
                    .status(RepositoryStatus.NOT_FOUND)
                    .build();
        }

        return RepositoryStatusResponse.builder()
                .repoId(repoId)
                .repositoryPath(metadata.getRepositoryPath())
                .repositoryName(metadata.getRepositoryName())
                .status(metadata.getStatus())
                .totalFiles(metadata.getTotalFiles())
                .indexedFiles(metadata.getIndexedFiles())
                .lastIndexedAt(metadata.getLastIndexedAt())
                .errorMessage(metadata.getErrorMessage())
                .build();
    }

    /**
     * Reindex a repository by its ID.
     *
     * @param repoId the repository ID
     * @return the index repository response
     */
    public IndexRepositoryResponse reindexRepository(String repoId) {
        RepositoryMetadata metadata = repositoryStore.get(repoId);

        if (metadata == null) {
            return IndexRepositoryResponse.builder()
                    .repoId(repoId)
                    .status("FAILED")
                    .message("Repository not found")
                    .timestamp(Instant.now())
                    .build();
        }

        String repositoryPath = metadata.getRepositoryPath();
        Path directoryPath = Paths.get(repositoryPath);

        // Validate path still exists
        if (!Files.exists(directoryPath) || !Files.isDirectory(directoryPath)) {
            return IndexRepositoryResponse.builder()
                    .repoId(repoId)
                    .repositoryPath(repositoryPath)
                    .status("FAILED")
                    .message("Repository path no longer exists")
                    .timestamp(Instant.now())
                    .build();
        }

        try {
            log.info("Starting reindexing for repository: {}", metadata.getRepositoryName());
            
            // Update status
            metadata.setStatus(RepositoryStatus.INDEXING);
            repositoryStore.put(repoId, metadata);

            // Delete existing code graph and rebuild
            fileNodeRepository.deleteCompleteCodeGraph();
            FileNode knowledgeGraph = knowledgeGraphBuilder.buildGraphFromDir(directoryPath.toFile()).getRootFileNode();
            knowledgeGraphBatchInsertService.batchInsertFileStructure(knowledgeGraph, embeddingModel.dimension());

            // Update metadata
            metadata.setStatus(RepositoryStatus.INDEXED);
            metadata.setLastIndexedAt(Instant.now());
            metadata.setTotalFiles(countFiles(directoryPath.toFile()));
            repositoryStore.put(repoId, metadata);

            log.info("Successfully reindexed repository: {}", metadata.getRepositoryName());

            return IndexRepositoryResponse.builder()
                    .repoId(repoId)
                    .repositoryPath(repositoryPath)
                    .repositoryName(metadata.getRepositoryName())
                    .status("INDEXED")
                    .message("Repository reindexed successfully")
                    .timestamp(Instant.now())
                    .build();

        } catch (Exception e) {
            log.error("Failed to reindex repository: {}", repoId, e);
            
            metadata.setStatus(RepositoryStatus.FAILED);
            metadata.setErrorMessage(e.getMessage());
            repositoryStore.put(repoId, metadata);

            return IndexRepositoryResponse.builder()
                    .repoId(repoId)
                    .repositoryPath(repositoryPath)
                    .status("FAILED")
                    .message("Failed to reindex repository: " + e.getMessage())
                    .timestamp(Instant.now())
                    .build();
        }
    }

    /**
     * Delete a repository by its ID.
     *
     * @param repoId the repository ID
     * @return true if deleted successfully, false otherwise
     */
    public boolean deleteRepository(String repoId) {
        RepositoryMetadata metadata = repositoryStore.get(repoId);

        if (metadata == null) {
            return false;
        }

        try {
            log.info("Deleting repository: {}", metadata.getRepositoryName());
            
            // Delete from Neo4j
            fileNodeRepository.deleteCompleteCodeGraph();
            
            // Remove from store
            repositoryStore.remove(repoId);
            
            log.info("Successfully deleted repository: {}", metadata.getRepositoryName());
            return true;

        } catch (Exception e) {
            log.error("Failed to delete repository: {}", repoId, e);
            return false;
        }
    }

    /**
     * Get all indexed repositories.
     *
     * @return list of repository status responses
     */
    public List<RepositoryStatusResponse> getAllRepositories() {
        return repositoryStore.values().stream()
                .map(metadata -> RepositoryStatusResponse.builder()
                        .repoId(metadata.getRepoId())
                        .repositoryPath(metadata.getRepositoryPath())
                        .repositoryName(metadata.getRepositoryName())
                        .status(metadata.getStatus())
                        .totalFiles(metadata.getTotalFiles())
                        .indexedFiles(metadata.getIndexedFiles())
                        .lastIndexedAt(metadata.getLastIndexedAt())
                        .errorMessage(metadata.getErrorMessage())
                        .build())
                .toList();
    }

    private String generateRepoId(String repositoryPath) {
        // Check if a repository with this path already exists
        Optional<String> existingId = repositoryStore.entrySet().stream()
                .filter(entry -> entry.getValue().getRepositoryPath().equals(repositoryPath))
                .map(Map.Entry::getKey)
                .findFirst();

        return existingId.orElse(UUID.randomUUID().toString());
    }

    private int countFiles(File directory) {
        int count = 0;
        File[] files = directory.listFiles();
        if (files != null) {
            for (File file : files) {
                if (file.isFile()) {
                    count++;
                } else if (file.isDirectory()) {
                    count += countFiles(file);
                }
            }
        }
        return count;
    }

    /**
     * Internal class to store repository metadata.
     */
    @lombok.Data
    @lombok.AllArgsConstructor
    private static class RepositoryMetadata {
        private String repoId;
        private String repositoryPath;
        private String repositoryName;
        private RepositoryStatus status;
        private Instant lastIndexedAt;
        private Integer totalFiles;
        private Integer indexedFiles;
        private String errorMessage;

        public RepositoryMetadata(String repoId, String repositoryPath, String repositoryName, 
                                  RepositoryStatus status, Instant lastIndexedAt) {
            this.repoId = repoId;
            this.repositoryPath = repositoryPath;
            this.repositoryName = repositoryName;
            this.status = status;
            this.lastIndexedAt = lastIndexedAt;
        }
    }
}
