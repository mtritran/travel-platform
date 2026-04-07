package com.mtritran.travelplatform.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "reviews")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @OneToOne
    @JoinColumn(name = "booking_id")
    Booking booking;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    User user; // The reviewer (Customer)

    @ManyToOne
    @JoinColumn(name = "tour_id")
    Tour tour;

    @OneToOne
    @JoinColumn(name = "tour_request_id")
    TourRequest tourRequest;

    @Column(nullable = false)
    int rating; // 1 to 5

    @Column(columnDefinition = "TEXT")
    String comment;

    @Column(length = 2000)
    String imagesUrl;

    @Builder.Default
    boolean active = true;

    @CreationTimestamp
    LocalDateTime createdAt;

    @UpdateTimestamp
    LocalDateTime updatedAt;
}
