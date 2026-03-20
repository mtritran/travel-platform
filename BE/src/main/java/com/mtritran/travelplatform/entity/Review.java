package com.mtritran.travelplatform.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

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
    @JoinColumn(name = "booking_id", nullable = false)
    Booking booking;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    User user; // The reviewer (Customer)

    @ManyToOne
    @JoinColumn(name = "tour_id", nullable = false)
    Tour tour;

    @Column(nullable = false)
    int rating; // 1 to 5

    @Column(columnDefinition = "TEXT")
    String comment;

    @CreationTimestamp
    LocalDateTime createdAt;
}
