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

    @NotBlank(message = "UNCATEGORIZED_EXCEPTION")
    String title;

    String description;

    @NotNull(message = "UNCATEGORIZED_EXCEPTION")
    BigDecimal price;

    String imageUrl;
}
