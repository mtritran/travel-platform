package com.mtritran.travelplatform.dto.response;

import com.mtritran.travelplatform.enums.TourRequestStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

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
    String description;
    TourRequestStatus status;
    String guideName; // populated when matched
    LocalDateTime createdAt;
}
