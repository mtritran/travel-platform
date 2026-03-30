package com.mtritran.travelplatform.entity;

import com.mtritran.travelplatform.enums.PayoutStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payout_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PayoutRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    User user;

    @Column(nullable = false)
    BigDecimal amount;

    @Column(nullable = false)
    String bankName;

    @Column(nullable = false)
    String bankAccountNumber;

    @Column(nullable = false)
    String bankAccountName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    PayoutStatus status = PayoutStatus.PENDING;

    String adminNote;

    @CreationTimestamp
    LocalDateTime createdAt;

    @UpdateTimestamp
    LocalDateTime updatedAt;

    LocalDateTime processedAt;
}
