package com.mtritran.travelplatform.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TourResponse {
    String id;
    String guideName;
    String locationName;
    String locationAddress;
    Double latitude;
    Double longitude;

    String meetingLocationName;
    String meetingLocationAddress;
    Double meetingLatitude;
    Double meetingLongitude;
    String title;
    String description;
    BigDecimal price;
    boolean active;
    String imageUrl;

    java.time.LocalDate startDate;

    java.time.LocalDate endDate;

    java.time.LocalTime startTime;

    java.time.LocalTime endTime;

    Integer maxGuests;
    BigDecimal depositPercentage;
    double rating;
    int reviewCount;
    LocalDateTime createdAt;
}
