package com.mtritran.travelplatform.dto.response;

import com.mtritran.travelplatform.enums.ApplicationStatus;
import com.mtritran.travelplatform.enums.InterviewStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GuideApplicationResponse {
    String id;
    String userId;
    String userFullName;

    // --- Identification ---
    String profilePhotoUrl;
    String idCardUrl;
    LocalDate idCardExpiry;

    // --- Legal ---
    String guideCardUrl;
    LocalDate guideCardExpiry;
    String certificateUrl;
    LocalDate certificateExpiry;
    String criminalRecordUrl;
    LocalDate criminalRecordIssuedAt;

    // --- Health ---
    String healthRecordUrl;
    LocalDate healthRecordDate;
    String drugTestResultUrl;
    LocalDate drugTestDate;

    // --- Info ---
    String languages;
    String specializations;
    String operatingAreas;
    Integer yearsOfExperience;

    // --- Status & Audit ---
    ApplicationStatus status;
    String rejectionReason;
    String adminNotes;

    // --- Interview & Training ---
    InterviewStatus interviewStatus;
    Instant interviewDate;
    String interviewNote;
    Boolean trainingCompleted;
    Instant trainingCompletedAt;
    Integer trainingScore;

    // --- Control ---
    Integer rejectCount;
    Instant lastRejectedAt;
    Instant cooldownUntil;

    Instant processedAt;
    Instant createdAt;
}
