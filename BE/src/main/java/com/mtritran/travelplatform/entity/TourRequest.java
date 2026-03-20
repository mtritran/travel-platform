package com.mtritran.travelplatform.entity;

import com.mtritran.travelplatform.enums.TourRequestStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

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

    @CreationTimestamp
    LocalDateTime createdAt;
}
