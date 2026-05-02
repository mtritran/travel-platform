package com.mtritran.travelplatform.dto.response;

import com.mtritran.travelplatform.entity.ChatMessage;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

/**
 * DTO nhẹ để gửi qua WebSocket, tránh LazyInitializationException
 * khi Jackson cố serialize toàn bộ Entity graph.
 */
@Data
@Builder
public class ChatMessageDTO {

    private String id;
    private String content;
    private String role;
    private boolean isBot;
    private Instant createdAt;

    // Chỉ giữ thông tin tối thiểu của người gửi & người nhận
    private UserSummary user;
    private UserSummary recipient;

    @Data
    @Builder
    public static class UserSummary {
        private String id;
        private String email;
        private String fullName;
        private String avatarUrl;
    }

    /** Chuyển đổi từ Entity sang DTO (phải gọi trong cùng transaction). */
    public static ChatMessageDTO from(ChatMessage msg) {
        return ChatMessageDTO.builder()
                .id(msg.getId())
                .content(msg.getContent())
                .role(msg.getRole())
                .isBot(msg.isBot())
                .createdAt(msg.getCreatedAt())
                .user(msg.getUser() != null ? UserSummary.builder()
                        .id(msg.getUser().getId())
                        .email(msg.getUser().getEmail())
                        .fullName(msg.getUser().getFullName())
                        .avatarUrl(msg.getUser().getAvatarUrl())
                        .build() : null)
                .recipient(msg.getRecipient() != null ? UserSummary.builder()
                        .id(msg.getRecipient().getId())
                        .email(msg.getRecipient().getEmail())
                        .fullName(msg.getRecipient().getFullName())
                        .avatarUrl(msg.getRecipient().getAvatarUrl())
                        .build() : null)
                .build();
    }
}
