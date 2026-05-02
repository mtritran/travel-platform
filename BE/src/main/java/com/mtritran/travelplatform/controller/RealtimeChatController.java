package com.mtritran.travelplatform.controller;

import com.mtritran.travelplatform.dto.response.ChatMessageDTO;
import com.mtritran.travelplatform.entity.ChatMessage;
import com.mtritran.travelplatform.entity.User;
import com.mtritran.travelplatform.repository.ChatMessageRepository;
import com.mtritran.travelplatform.repository.UserRepository;
import lombok.AccessLevel;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.Instant;

@Controller
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class RealtimeChatController {

    SimpMessagingTemplate messagingTemplate;
    ChatMessageRepository chatMessageRepository;
    UserRepository userRepository;

    @Data
    public static class P2PMessageRequest {
        String senderEmail;
        String recipientId;
        String content;
    }

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload P2PMessageRequest request) {
        log.info("P2P Message from {} to {}", request.getSenderEmail(), request.getRecipientId());

        User sender = userRepository.findByEmail(request.getSenderEmail()).orElse(null);
        User recipient = userRepository.findById(request.getRecipientId()).orElse(null);

        if (sender != null && recipient != null) {
            log.info("Saving message from {} to {}", sender.getEmail(), recipient.getEmail());
            ChatMessage chatMessage = ChatMessage.builder()
                    .user(sender)
                    .recipient(recipient)
                    .content(request.getContent())
                    .role("USER")
                    .isBot(false)
                    .createdAt(Instant.now())
                    .build();
            
            ChatMessage saved = chatMessageRepository.save(chatMessage);
            log.info("Message saved with ID: {}", saved.getId());

            // Chuyển sang DTO ngay trong session để tránh LazyInitializationException
            ChatMessageDTO dto = ChatMessageDTO.from(saved);

            messagingTemplate.convertAndSend("/topic/messages/" + recipient.getEmail(), dto);
            messagingTemplate.convertAndSend("/topic/messages/" + sender.getEmail(), dto);
        } else {
            log.warn("Failed to process message: sender={} recipient={}", sender, recipient);
        }
    }
}
