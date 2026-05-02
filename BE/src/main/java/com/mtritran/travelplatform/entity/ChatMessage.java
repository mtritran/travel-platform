package com.mtritran.travelplatform.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "chat_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChatMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"password", "roles", "balance", "hasPaymentPin"})
    User user; // Người gửi

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id")
    @JsonIgnoreProperties({"password", "roles", "balance", "hasPaymentPin"})
    User recipient; // Người nhận (null nếu là AI)

    @Column(columnDefinition = "TEXT", nullable = false)
    String content;

    @Column(nullable = false)
    String role; // "USER" hoặc "AI"

    @Builder.Default
    @Column(name = "is_bot")
    boolean isBot = true; // Phân biệt chat với bot hay với người

    @CreationTimestamp
    Instant createdAt;
}
