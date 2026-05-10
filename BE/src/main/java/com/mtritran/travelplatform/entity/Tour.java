package com.mtritran.travelplatform.entity;

import com.mtritran.travelplatform.enums.TourStatus;
import com.mtritran.travelplatform.enums.TransportType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

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

    @Column(columnDefinition = "TEXT", nullable = false)
    String title;

    @Column(columnDefinition = "TEXT")
    String description;

    @Column(nullable = false)
    BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    TourStatus status = TourStatus.ACTIVE;

    @Column(columnDefinition = "TEXT")
    String imageUrl;

    @Column
    LocalDate startDate;

    @Column
    LocalDate endDate;

    @Column
    LocalTime startTime;

    @Column
    LocalTime endTime;

    @Column
    @Builder.Default
    Integer maxGuests = 1;

    @Column
    @Builder.Default
    BigDecimal depositPercentage = BigDecimal.valueOf(30);

    @Column
    @Builder.Default
    Integer bookingCutoffMinutes = 60; // Default preparation time (60 mins)

    @Column(columnDefinition = "TEXT")
    String hiddenReason;

    @Column(nullable = false)
    @Builder.Default
    Integer minGuests = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    TransportType transportType = TransportType.WALKING;

    @Column(columnDefinition = "TEXT")
    String transportInfo;

    @Column(columnDefinition = "TEXT")
    String transportImagesUrl;

    @OneToMany(mappedBy = "tour", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("stepOrder ASC")
    List<TourItinerary> itineraries;

    @CreationTimestamp
    LocalDateTime createdAt;

    @UpdateTimestamp
    LocalDateTime updatedAt;
}
