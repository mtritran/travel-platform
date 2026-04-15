package com.mtritran.travelplatform.entity;

import com.mtritran.travelplatform.enums.BookingStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Instant;

@Entity
@Table(name = "bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(unique = true)
    String bookingCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tour_id", nullable = false)
    Tour tour;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pickup_location_id")
    Location pickupLocation;

    @Column(nullable = false)
    LocalDate bookingDate;

    @Column(nullable = false)
    BigDecimal totalPrice;

    @Column(nullable = false)
    @Builder.Default
    Integer numberOfGuests = 1;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    BookingStatus status = BookingStatus.PENDING;

    @Column
    BigDecimal depositAmount;

    @Column
    @Builder.Default
    BigDecimal paidAmount = BigDecimal.ZERO;

    @Column
    @Builder.Default
    BigDecimal refundAmount = BigDecimal.ZERO;

    @Column
    java.time.LocalTime startTime;

    @CreationTimestamp
    Instant createdAt;

    @UpdateTimestamp
    Instant updatedAt;

    @Builder.Default
    boolean isDisputed = false;

    @Column(columnDefinition = "TEXT")
    String disputeReason;

    @Column(length = 2000)
    String disputeEvidenceUrl;

    Instant disputedAt;

    Instant payoutAt;

    @Builder.Default
    boolean isPaidOut = false;

    @PrePersist
    public void generateBookingCode() {
        if (this.bookingCode == null) {
            String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            StringBuilder sb = new StringBuilder("TX-");
            java.util.Random rnd = new java.util.Random();
            for (int i = 0; i < 7; i++) {
                sb.append(chars.charAt(rnd.nextInt(chars.length())));
            }
            this.bookingCode = sb.toString();
        }
    }
}
