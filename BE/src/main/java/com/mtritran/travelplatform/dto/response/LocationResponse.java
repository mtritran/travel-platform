package com.mtritran.travelplatform.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LocationResponse {
    String id;
    String name;
    String address;
    Double latitude;
    Double longitude;
    String imageUrl;
}
