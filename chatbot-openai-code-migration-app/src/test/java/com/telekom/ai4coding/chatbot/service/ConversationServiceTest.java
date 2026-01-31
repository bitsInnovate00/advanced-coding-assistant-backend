package com.telekom.ai4coding.chatbot.service;

import com.telekom.ai4coding.chatbot.repository.ConversationNodeRepository;
import com.telekom.ai4coding.chatbot.repository.conversation.ConversationNode;
import com.telekom.ai4coding.chatbot.repository.conversation.MessageNode;
import dev.langchain4j.data.message.ChatMessageType;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConversationServiceTest {

    @Mock
    private ConversationNodeRepository conversationNodeRepository;

    @InjectMocks
    private ConversationService conversationService;

    @Test
    void getConversation_shouldReturnConversationWithMetadata() {
        // Given
        String conversationId = "test-id";
        MessageNode message1 = MessageNode.of(ChatMessageType.USER, "Hello", null);
        MessageNode message2 = MessageNode.of(ChatMessageType.AI, "Hi there!", message1);
        List<MessageNode> messages = Arrays.asList(message1, message2);
        
        ConversationNode conversationNode = ConversationNode.of("Test Conversation", messages);
        when(conversationNodeRepository.findById(conversationId)).thenReturn(Optional.of(conversationNode));

        // When
        Map<String, String> result = conversationService.getConversation(conversationId);

        // Then
        assertNotNull(result);
        assertEquals("Test Conversation", result.get("title"));
        assertEquals("2", result.get("messageCount"));
        // createdAt and updatedAt will be null for newly created nodes without persistence
        verify(conversationNodeRepository, times(1)).findById(conversationId);
    }

    @Test
    void getConversation_withNoMessages_shouldReturnZeroMessageCount() {
        // Given
        String conversationId = "test-id";
        ConversationNode conversationNode = ConversationNode.of("Empty Conversation");
        when(conversationNodeRepository.findById(conversationId)).thenReturn(Optional.of(conversationNode));

        // When
        Map<String, String> result = conversationService.getConversation(conversationId);

        // Then
        assertNotNull(result);
        assertEquals("Empty Conversation", result.get("title"));
        assertEquals("0", result.get("messageCount"));
    }

    @Test
    void getAllConversations_shouldReturnConversationsWithMetadata() {
        // Given
        MessageNode message1 = MessageNode.of(ChatMessageType.USER, "Hello", null);
        List<MessageNode> messages = Arrays.asList(message1);
        
        ConversationNode conversation1 = ConversationNode.of("Conversation 1", messages);
        ConversationNode conversation2 = ConversationNode.of("Conversation 2");
        
        when(conversationNodeRepository.findAll()).thenReturn(Arrays.asList(conversation1, conversation2));

        // When
        List<Map<String, String>> results = conversationService.getAllConversations();

        // Then
        assertNotNull(results);
        assertEquals(2, results.size());
        
        // Check that messageCount is present
        assertTrue(results.stream().anyMatch(r -> "1".equals(r.get("messageCount"))));
        assertTrue(results.stream().anyMatch(r -> "0".equals(r.get("messageCount"))));
        
        verify(conversationNodeRepository, times(1)).findAll();
    }

    @Test
    void getConversation_notFound_shouldThrowException() {
        // Given
        String conversationId = "non-existent-id";
        when(conversationNodeRepository.findById(conversationId)).thenReturn(Optional.empty());

        // When/Then
        assertThrows(IllegalStateException.class, () -> 
            conversationService.getConversation(conversationId));
    }
}
