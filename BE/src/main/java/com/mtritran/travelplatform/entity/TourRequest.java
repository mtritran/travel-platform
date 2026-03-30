package com.mtritran.travelplatform.entity;

import com.mtritran.travelplatform.enums.TourRequestStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Instant;
import java.time.LocalTime;

@Entity
@Table(name = "tour_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TourRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id")
    Location location;

    // Optional: if user wants a custom destination not in our list
    String customLocationName;
    Double latitude;
    Double longitude;

    @Column(nullable = false)
    LocalDate plannedDate;

    Instant expiresAt;

    @Column(nullable = false)
    String title;

    BigDecimal budget;

    @Column(nullable = false)
    @Builder.Default
    Integer numberOfGuests = 1;

    @Column(columnDefinition = "TEXT")
    String description;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    TourRequestStatus status = TourRequestStatus.OPEN;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guide_id")
    User guide; // The guide who accepted the request

    // Extended fields to match Tour flow
    String meetingLocationName;
    Double meetingLatitude;
    Double meetingLongitude;

    LocalTime startTime;
    LocalTime endTime;

    @Column(nullable = false)
    @Builder.Default
    BigDecimal depositPercentage = BigDecimal.valueOf(30);

    @Builder.Default
    BigDecimal depositAmount = BigDecimal.ZERO;

    @Builder.Default
    BigDecimal paidAmount = BigDecimal.ZERO;

    @Builder.Default
    BigDecimal refundAmount = BigDecimal.ZERO;

    String paymentStatus; // PENDING, PAID_DEPOSIT, PAID_FULL, REFUNDED

    @CreationTimestamp
    Instant createdAt;
}
