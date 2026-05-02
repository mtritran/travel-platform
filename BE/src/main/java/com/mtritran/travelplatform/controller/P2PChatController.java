package com.mtritran.travelplatform.controller;

import com.mtritran.travelplatform.dto.response.ApiResponse;
import com.mtritran.travelplatform.dto.response.ChatMessageDTO;
import com.mtritran.travelplatform.entity.User;
import com.mtritran.travelplatform.repository.ChatMessageRepository;
import com.mtritran.travelplatform.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class P2PChatController {

    ChatMessageRepository chatMessageRepository;
    UserRepository userRepository;

    @GetMapping("/history/{recipientId}")
    public ApiResponse<List<ChatMessageDTO>> getP2PHistory(@PathVariable String recipientId) {
        String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(currentEmail).orElseThrow();
        User recipient = userRepository.findById(recipientId).orElseThrow();

        List<ChatMessageDTO> result = chatMessageRepository
                .findP2PHistory(currentUser, recipient)
                .stream()
                .map(ChatMessageDTO::from)
                .collect(Collectors.toList());

        return ApiResponse.<List<ChatMessageDTO>>builder()
                .result(result)
                .build();
    }

    @GetMapping("/conversations")
    public ApiResponse<List<ChatMessageDTO>> getConversations() {
        String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(currentEmail).orElseThrow();

        log.info("Fetching conversations for user: {} (ID: {})", currentEmail, currentUser.getId());

        List<ChatMessageDTO> result = chatMessageRepository
                .findRecentConversations(currentUser.getId())
                .stream()
                .map(ChatMessageDTO::from)
                .collect(Collectors.toList());

        log.info("Found {} conversations", result.size());

        return ApiResponse.<List<ChatMessageDTO>>builder()
                .result(result)
                .build();
    }

    @DeleteMapping("/conversations/{partnerId}")
    public ApiResponse<Void> deleteConversation(@PathVariable String partnerId) {
        String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(currentEmail).orElseThrow();

        log.info("Deleting conversation between {} and {}", currentUser.getId(), partnerId);
        chatMessageRepository.deleteConversationBetween(currentUser.getId(), partnerId);

        return ApiResponse.<Void>builder().build();
    }
}
