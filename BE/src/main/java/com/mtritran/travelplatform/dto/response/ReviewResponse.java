package com.mtritran.travelplatform.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReviewResponse {
    String id;
    String userName;
    String userAvatarUrl;
    String userPhone;
    String tourTitle;
    int rating;
    String comment;
    String imagesUrl;
    String tourId;
    String tourRequestId;
    boolean active;
    LocalDateTime createdAt;
}
