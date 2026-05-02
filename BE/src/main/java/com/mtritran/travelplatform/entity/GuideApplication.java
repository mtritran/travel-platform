package com.mtritran.travelplatform.entity;

import com.mtritran.travelplatform.enums.ApplicationStatus;
import com.mtritran.travelplatform.enums.InterviewStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "guide_applications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GuideApplication {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    User user;

    // --- Identification Group ---
    @Column(nullable = false)
    String profilePhotoUrl; // Chân dung đối chiếu

    @Column(nullable = false)
    String idCardUrl;

    @Column
    LocalDate idCardExpiry;

    // --- Legal & Training Group ---
    @Column(nullable = false)
    String guideCardUrl;

    @Column
    LocalDate guideCardExpiry;

    @Column(nullable = false)
    String certificateUrl; // Chứng chỉ ngoại ngữ/chuyên môn

    @Column
    LocalDate certificateExpiry;

    @Column
    String criminalRecordUrl;

    @Column
    LocalDate criminalRecordIssuedAt;

    // --- Health Group ---
    @Column
    String healthRecordUrl; // Giấy khám sức khoẻ

    @Column
    LocalDate healthRecordDate;

    @Column
    String drugTestResultUrl; // Xét nghiệm ma tuý âm tính

    @Column
    LocalDate drugTestDate;

    // --- Competency Group ---
    @Column(columnDefinition = "TEXT")
    String languages;

    @Column(columnDefinition = "TEXT")
    String specializations;

    @Column(columnDefinition = "TEXT")
    String operatingAreas;

    @Column
    Integer yearsOfExperience;

    // --- Internal Status & Audit ---
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    ApplicationStatus status = ApplicationStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    String rejectionReason;

    @Column(columnDefinition = "TEXT")
    String adminNotes;

    // --- Interview & Training Tracking ---
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    InterviewStatus interviewStatus = InterviewStatus.NOT_REQUIRED;

    @Column
    Instant interviewDate;

    @Column(columnDefinition = "TEXT")
    String interviewNote;

    @Column(nullable = false)
    @Builder.Default
    Boolean trainingCompleted = false;

    @Column
    Instant trainingCompletedAt;

    @Column
    Integer trainingScore;

    // --- Re-apply Controls ---
    @Column(nullable = false)
    @Builder.Default
    Integer rejectCount = 0;

    @Column
    Instant lastRejectedAt;

    @Column
    Instant cooldownUntil;

    // --- Common Audit ---
    @Column
    Instant processedAt;

    @CreationTimestamp
    @Column(updatable = false)
    Instant createdAt;

    @UpdateTimestamp
    Instant updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by")
    User processedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interviewed_by")
    User interviewedBy;
}
