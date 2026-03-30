package com.mtritran.travelplatform.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TourCreateRequest {
    @NotBlank(message = "LOCATION_NOT_FOUND")
    String locationId;

    @NotBlank(message = "LOCATION_NOT_FOUND")
    String meetingLocationId;

    @NotBlank(message = "TITLE_REQUIRED")
    String title;
    
    String description;
    
    @NotNull(message = "PRICE_REQUIRED")
    BigDecimal price;
    
    String imageUrl;
    
    @NotNull(message = "START_DATE_REQUIRED")
    java.time.LocalDate startDate;
    
    java.time.LocalDate endDate;
    
    @NotNull(message = "START_TIME_REQUIRED")
    java.time.LocalTime startTime;
    
    java.time.LocalTime endTime;
    
    Integer maxGuests;
    BigDecimal depositPercentage;
}
