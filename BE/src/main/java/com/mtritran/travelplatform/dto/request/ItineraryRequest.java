package com.mtritran.travelplatform.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ItineraryRequest {
    String timeSlot;
    String activity;
    String description;
    String imageUrl;
    int stepOrder;
}
