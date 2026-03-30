package com.mtritran.travelplatform.dto.response;

import com.mtritran.travelplatform.enums.TourRequestStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TourRequestResponse {
    String id;
    String userName;
    String locationName;
    String customLocationName;
    LocalDate plannedDate;
    BigDecimal budget;
    Integer numberOfGuests;
    String title;
    String description;
    TourRequestStatus status;
    String guideName; 
    String guideEmail;
    String guidePhone;
    String customerPhone;
    String customerEmail;
    String customerName;
    java.time.Instant createdAt;
    java.time.Instant expiresAt;
    
    String meetingLocationName;
    Double meetingLatitude;
    Double meetingLongitude;
    java.time.LocalTime startTime;
    java.time.LocalTime endTime;
    BigDecimal depositPercentage;
    BigDecimal depositAmount;
    BigDecimal paidAmount;
    String paymentStatus;

    java.util.List<TourRequestInterestResponse> interestedGuides;
}
