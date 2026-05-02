package com.mtritran.travelplatform.entity;

import com.mtritran.travelplatform.enums.Gender;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@FieldDefaults(level = AccessLevel.PRIVATE)
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(unique = true, nullable = false)
    String email;

    @Column(unique = true)
    String phone;

    @Column(nullable = false)
    String fullName;

    @Enumerated(EnumType.STRING)
    Gender gender;

    LocalDate dob;

    @Column(nullable = false)
    String password;

    @Column(name = "payment_pin")
    String paymentPin;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"), inverseJoinColumns = @JoinColumn(name = "role_id"))
    @Builder.Default
    Set<Role> roles = new HashSet<>();

    @Builder.Default
    BigDecimal balance = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    String biography;

    String languages;

    Integer yearsOfExperience;

    String specialties;
    
    @Column(columnDefinition = "TEXT")
    String operatingAreas;

    // --- Location & GPS ---
    Double currentLat;
    Double currentLong;
    
    @Column(columnDefinition = "TEXT")
    String currentAddress;

    Instant lastLocationUpdate;

    @Builder.Default
    Integer penaltyPoints = 0;

    @Builder.Default
    Integer cancellationCount = 0;

    Instant guideBannedUntil;
    Instant customerBannedUntil;

    String avatarUrl;
    
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    GuideApplication guideApplication;

    @CreationTimestamp
    Instant createdAt;

    @UpdateTimestamp
    Instant updatedAt;
}
