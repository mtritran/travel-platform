package com.mtritran.travelplatform.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TourRequestInterestResponse {
    String id;
    String guideId;
    String guideName;
    String guideEmail;
    String guidePhone;
    String message;
    LocalDateTime createdAt;
}
