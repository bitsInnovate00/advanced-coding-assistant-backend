package com.telekom.ai4coding.chatbot.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.telekom.ai4coding.chatbot.dto.IndexRepositoryRequest;
import com.telekom.ai4coding.chatbot.dto.IndexRepositoryResponse;
import com.telekom.ai4coding.chatbot.dto.RepositoryStatusResponse;
import com.telekom.ai4coding.chatbot.dto.RepositoryStatusResponse.RepositoryStatus;
import com.telekom.ai4coding.chatbot.service.VSCodeRepositoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = VSCodeRepositoryController.class)
public class VSCodeRepositoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private VSCodeRepositoryService vsCodeRepositoryService;

    private IndexRepositoryRequest validRequest;
    private IndexRepositoryResponse successResponse;
    private RepositoryStatusResponse indexedStatus;

    @BeforeEach
    void setUp() {
        validRequest = IndexRepositoryRequest.builder()
                .repositoryPath("/path/to/repo")
                .repositoryName("test-repo")
                .build();

        successResponse = IndexRepositoryResponse.builder()
                .repoId("test-repo-id")
                .repositoryPath("/path/to/repo")
                .repositoryName("test-repo")
                .status("INDEXED")
                .message("Repository indexed successfully")
                .timestamp(Instant.now())
                .build();

        indexedStatus = RepositoryStatusResponse.builder()
                .repoId("test-repo-id")
                .repositoryPath("/path/to/repo")
                .repositoryName("test-repo")
                .status(RepositoryStatus.INDEXED)
                .totalFiles(100)
                .indexedFiles(100)
                .lastIndexedAt(Instant.now())
                .build();
    }

    @Test
    void indexRepository_WithValidRequest_ShouldReturnCreated() throws Exception {
        when(vsCodeRepositoryService.indexRepository(any(IndexRepositoryRequest.class)))
                .thenReturn(successResponse);

        mockMvc.perform(post("/api/v1/repositories/index")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.repoId").value("test-repo-id"))
                .andExpect(jsonPath("$.status").value("INDEXED"))
                .andExpect(jsonPath("$.message").value("Repository indexed successfully"));
    }

    @Test
    void indexRepository_WithInvalidPath_ShouldReturnBadRequest() throws Exception {
        IndexRepositoryResponse failedResponse = IndexRepositoryResponse.builder()
                .repositoryPath("/invalid/path")
                .status("FAILED")
                .message("Invalid path: Path does not exist or is not a directory")
                .timestamp(Instant.now())
                .build();

        when(vsCodeRepositoryService.indexRepository(any(IndexRepositoryRequest.class)))
                .thenReturn(failedResponse);

        IndexRepositoryRequest invalidRequest = IndexRepositoryRequest.builder()
                .repositoryPath("/invalid/path")
                .build();

        mockMvc.perform(post("/api/v1/repositories/index")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value("FAILED"));
    }

    @Test
    void indexRepository_WithMissingPath_ShouldReturnBadRequest() throws Exception {
        IndexRepositoryRequest requestWithoutPath = IndexRepositoryRequest.builder()
                .repositoryName("test-repo")
                .build();

        mockMvc.perform(post("/api/v1/repositories/index")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestWithoutPath)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getRepositoryStatus_WithExistingRepo_ShouldReturnOk() throws Exception {
        when(vsCodeRepositoryService.getRepositoryStatus(anyString()))
                .thenReturn(indexedStatus);

        mockMvc.perform(get("/api/v1/repositories/test-repo-id/status")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.repoId").value("test-repo-id"))
                .andExpect(jsonPath("$.status").value("INDEXED"))
                .andExpect(jsonPath("$.totalFiles").value(100));
    }

    @Test
    void getRepositoryStatus_WithNonExistingRepo_ShouldReturnNotFound() throws Exception {
        RepositoryStatusResponse notFoundStatus = RepositoryStatusResponse.builder()
                .repoId("non-existing-id")
                .status(RepositoryStatus.NOT_FOUND)
                .build();

        when(vsCodeRepositoryService.getRepositoryStatus(anyString()))
                .thenReturn(notFoundStatus);

        mockMvc.perform(get("/api/v1/repositories/non-existing-id/status")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    void reindexRepository_WithExistingRepo_ShouldReturnOk() throws Exception {
        IndexRepositoryResponse reindexResponse = IndexRepositoryResponse.builder()
                .repoId("test-repo-id")
                .repositoryPath("/path/to/repo")
                .repositoryName("test-repo")
                .status("INDEXED")
                .message("Repository reindexed successfully")
                .timestamp(Instant.now())
                .build();

        when(vsCodeRepositoryService.reindexRepository(anyString()))
                .thenReturn(reindexResponse);

        mockMvc.perform(post("/api/v1/repositories/test-repo-id/reindex")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.repoId").value("test-repo-id"))
                .andExpect(jsonPath("$.status").value("INDEXED"))
                .andExpect(jsonPath("$.message").value("Repository reindexed successfully"));
    }

    @Test
    void reindexRepository_WithNonExistingRepo_ShouldReturnNotFound() throws Exception {
        IndexRepositoryResponse notFoundResponse = IndexRepositoryResponse.builder()
                .repoId("non-existing-id")
                .status("FAILED")
                .message("Repository not found")
                .timestamp(Instant.now())
                .build();

        when(vsCodeRepositoryService.reindexRepository(anyString()))
                .thenReturn(notFoundResponse);

        mockMvc.perform(post("/api/v1/repositories/non-existing-id/reindex")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteRepository_WithExistingRepo_ShouldReturnNoContent() throws Exception {
        when(vsCodeRepositoryService.deleteRepository(anyString()))
                .thenReturn(true);

        mockMvc.perform(delete("/api/v1/repositories/test-repo-id"))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteRepository_WithNonExistingRepo_ShouldReturnNotFound() throws Exception {
        when(vsCodeRepositoryService.deleteRepository(anyString()))
                .thenReturn(false);

        mockMvc.perform(delete("/api/v1/repositories/non-existing-id"))
                .andExpect(status().isNotFound());
    }

    @Test
    void getAllRepositories_ShouldReturnOk() throws Exception {
        List<RepositoryStatusResponse> repositories = Collections.singletonList(indexedStatus);

        when(vsCodeRepositoryService.getAllRepositories())
                .thenReturn(repositories);

        mockMvc.perform(get("/api/v1/repositories")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].repoId").value("test-repo-id"))
                .andExpect(jsonPath("$[0].status").value("INDEXED"));
    }

    @Test
    void getAllRepositories_WhenEmpty_ShouldReturnEmptyList() throws Exception {
        when(vsCodeRepositoryService.getAllRepositories())
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/v1/repositories")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }
}
