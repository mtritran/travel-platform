package com.mtritran.travelplatform.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "tours")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Tour {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guide_id", nullable = false)
    User guide;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id", nullable = false)
    Location location;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meeting_location_id")
    Location meetingLocation;

    @Column(nullable = false)
    String title;

    @Column(columnDefinition = "TEXT")
    String description;

    @Column(nullable = false)
    BigDecimal price;

    @Column(nullable = false)
    @Builder.Default
    boolean active = true;

    String imageUrl;

    @Column
    java.time.LocalDate startDate;

    @Column
    java.time.LocalDate endDate;

    @Column
    java.time.LocalTime startTime;

    @Column
    java.time.LocalTime endTime;

    @Column
    @Builder.Default
    Integer maxGuests = 1;

    @Column
    @Builder.Default
    BigDecimal depositPercentage = BigDecimal.valueOf(30);

    @CreationTimestamp
    LocalDateTime createdAt;

    @UpdateTimestamp
    LocalDateTime updatedAt;
}
