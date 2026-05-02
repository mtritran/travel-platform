package com.mtritran.travelplatform.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GuideApplicationRequest {
    // --- Files ---
    MultipartFile profilePhotoFile;
    MultipartFile idCardFile;
    MultipartFile guideCardFile;
    MultipartFile certificateFile;
    MultipartFile criminalRecordFile;
    MultipartFile healthRecordFile;
    MultipartFile drugTestFile;

    // --- Dates ---
    LocalDate idCardExpiry;
    LocalDate guideCardExpiry;
    LocalDate certificateExpiry;
    LocalDate criminalRecordIssuedAt;
    LocalDate healthRecordDate;
    LocalDate drugTestDate;

    // --- Info ---
    String languages;
    String specializations;
    String operatingAreas;
    Integer yearsOfExperience;
}
