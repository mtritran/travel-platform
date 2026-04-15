package com.mtritran.travelplatform.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "locations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Location {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(columnDefinition = "TEXT", nullable = false)
    String name;

    @Column(columnDefinition = "TEXT")
    String address;

    //Vi do
    @Column(nullable = false)
    Double latitude;

    //Kinh do
    @Column(nullable = false)
    Double longitude;

    @Column(columnDefinition = "TEXT")
    String imageUrl;

    @CreationTimestamp
    Instant createdAt;

    @UpdateTimestamp
    Instant updatedAt;
}
