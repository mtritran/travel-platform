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
    String title;
    String description;
    BigDecimal price;
    boolean active;
    String imageUrl;
    LocalDateTime createdAt;
}
