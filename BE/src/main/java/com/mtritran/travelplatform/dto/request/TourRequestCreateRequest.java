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

    @NotNull(message = "UNCATEGORIZED_EXCEPTION")
    LocalDate plannedDate;

    BigDecimal budget;
    String description;
}
