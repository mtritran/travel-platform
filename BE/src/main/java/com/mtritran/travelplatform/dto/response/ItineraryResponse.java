package com.mtritran.travelplatform.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ItineraryResponse {
    String id;
    String timeSlot;
    String activity;
    String description;
    String imageUrl;
    int stepOrder;
}
