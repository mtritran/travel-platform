package com.mtritran.travelplatform.dto.response;

import com.mtritran.travelplatform.enums.ApplicationStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GuideApplicationResponse {
    String id;
    String userId;
    String userFullName;
    String idCardUrl;
    String guideCardUrl;
    String certificateUrl;
    ApplicationStatus status;
    String rejectionReason;
    LocalDateTime createdAt;
}
