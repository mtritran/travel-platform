package com.mtritran.travelplatform.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TourRequestCreateRequest {
    String locationId; // Optional if using custom
    String customLocationName;
    Double latitude;
    Double longitude;

    @NotNull(message = "DATE_REQUIRED")
    LocalDate plannedDate;

    BigDecimal budget;
    Integer numberOfGuests;
    String title;
    String description;
    Integer expiryHours;

    String meetingLocationName;
    Double meetingLatitude;
    Double meetingLongitude;
    java.time.LocalTime startTime;
    java.time.LocalTime endTime;
    BigDecimal depositPercentage;
}
