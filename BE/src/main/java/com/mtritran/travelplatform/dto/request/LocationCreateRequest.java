package com.mtritran.travelplatform.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LocationCreateRequest {
    String name;
    String address;
    Double latitude;
    Double longitude;
    String imageUrl;
}
