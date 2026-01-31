package com.telekom.ai4coding.chatbot.controller;

import com.telekom.ai4coding.chatbot.service.ConversationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = ConversationController.class)
public class ConversationControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ConversationService conversationService;

    @BeforeEach
    void setUp() {
        // Setup mock responses for the service methods used in the tests
        Map<String, String> conversation123 = new HashMap<>();
        conversation123.put("id", "123");
        conversation123.put("title", "Test Conversation");
        conversation123.put("createdAt", "2024-01-15T10:30:00");
        conversation123.put("updatedAt", "2024-01-15T12:00:00");
        conversation123.put("messageCount", "5");

        Map<String, String> conversation456 = new HashMap<>();
        conversation456.put("id", "456");
        conversation456.put("title", "Another Conversation");
        conversation456.put("createdAt", "2024-01-14T09:00:00");
        conversation456.put("updatedAt", "2024-01-14T11:00:00");
        conversation456.put("messageCount", "3");

        when(conversationService.getConversation(anyString()))
                .thenReturn(conversation123);

        when(conversationService.getAllConversations())
                .thenReturn(Arrays.asList(conversation123, conversation456));

        Map<String, String> message1 = new HashMap<>();
        message1.put("messageId", "1");
        Map<String, String> message2 = new HashMap<>();
        message2.put("messageId", "2");

        when(conversationService.getConversationMessages(anyString()))
                .thenReturn(Arrays.asList(message1, message2));
        when(conversationService.renameConversation(anyString(), anyString())).thenReturn("New Conversation Title");
    }

    @Test
    void testGetConversation() throws Exception {
        // GIVEN: A conversation ID "123"
        String conversationId = "123";

        // WHEN: Sending a GET request to "/v1/conversations/{conversationId}"
        mockMvc.perform(get("/v1/conversations/{conversationId}", conversationId)
                        .accept(MediaType.APPLICATION_JSON))
                // THEN: The status is OK and the response contains the expected conversation with metadata
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("123"))
                .andExpect(jsonPath("$.title").value("Test Conversation"))
                .andExpect(jsonPath("$.createdAt").value("2024-01-15T10:30:00"))
                .andExpect(jsonPath("$.updatedAt").value("2024-01-15T12:00:00"))
                .andExpect(jsonPath("$.messageCount").value("5"));
    }

    @Test
    void testGetAllConversations() throws Exception {
        // WHEN: Sending a GET request to "/v1/conversations"
        mockMvc.perform(get("/v1/conversations")
                        .accept(MediaType.APPLICATION_JSON))
                // THEN: The status is OK and the response contains the expected list of conversations with metadata
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("123"))
                .andExpect(jsonPath("$[0].title").value("Test Conversation"))
                .andExpect(jsonPath("$[0].createdAt").value("2024-01-15T10:30:00"))
                .andExpect(jsonPath("$[0].updatedAt").value("2024-01-15T12:00:00"))
                .andExpect(jsonPath("$[0].messageCount").value("5"))
                .andExpect(jsonPath("$[1].id").value("456"))
                .andExpect(jsonPath("$[1].title").value("Another Conversation"))
                .andExpect(jsonPath("$[1].messageCount").value("3"));
    }

    @Test
    void testGetConversationMessages() throws Exception {
        // GIVEN: A conversation ID "123"
        String conversationId = "123";

        // WHEN: Sending a GET request to "/v1/conversations/{conversationId}/messages"
        mockMvc.perform(get("/v1/conversations/{conversationId}/messages", conversationId)
                        .accept(MediaType.APPLICATION_JSON))
                // THEN: The status is OK and the response contains the expected messages
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].messageId").value("1"))
                .andExpect(jsonPath("$[1].messageId").value("2"));
    }

    @Test
    void testDeleteConversation() throws Exception {
        // GIVEN: A conversation ID "123"
        String conversationId = "123";

        // WHEN: Sending a DELETE request to "/v1/conversations/{conversationId}"
        mockMvc.perform(delete("/v1/conversations/{conversationId}", conversationId))
                // THEN: The status is OK (200) and no content is returned
                .andExpect(status().isOk());
    }

    @Test
    void givenValidTitle_whenRenameConversation_thenReturnStatusOk() throws Exception {
        // Given
        String conversationId = "123";
        String newTitle = "New Conversation Title";

        // Then
        mockMvc.perform(patch("/v1/conversations/{conversationId}/rename", conversationId)
                        .param("newTitle", newTitle)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().string(newTitle));

        verify(conversationService, times(1)).renameConversation(conversationId, newTitle);
    }

    @Test
    void givenEmptyTitle_whenRenameConversation_thenReturnBadRequest() throws Exception {
        // Then
        mockMvc.perform(patch("/v1/conversations/{conversationId}/rename", "123")
                        .param("newTitle", "")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("New title cannot be empty."));

        verify(conversationService, never()).renameConversation(anyString(), anyString());
    }

    @Test
    void givenNonExistentConversation_whenRenameConversation_thenReturnNotFound() throws Exception {
        // Given
        String conversationId = "nonExistentId";
        String newTitle = "New Title";
        when(conversationService.renameConversation(conversationId, newTitle))
                .thenThrow(new IllegalArgumentException("Conversation not found"));

        // Then
        mockMvc.perform(patch("/v1/conversations/{conversationId}/rename", conversationId)
                        .param("newTitle", newTitle)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(content().string("Conversation not found"));

        verify(conversationService, times(1)).renameConversation(conversationId, newTitle);
    }

    @Test
    void givenServiceThrowsException_whenRenameConversation_thenReturnInternalServerError() throws Exception {
        // Given
        String conversationId = "123";
        String newTitle = "New Title";
        when(conversationService.renameConversation(conversationId, newTitle))
                .thenThrow(new RuntimeException("Unexpected error"));

        // When & Then
        mockMvc.perform(patch("/v1/conversations/{conversationId}/rename", conversationId)
                        .param("newTitle", newTitle)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError())
                .andExpect(content().string("An error occurred while renaming the conversation."));

        verify(conversationService, times(1)).renameConversation(conversationId, newTitle);
    }

}
