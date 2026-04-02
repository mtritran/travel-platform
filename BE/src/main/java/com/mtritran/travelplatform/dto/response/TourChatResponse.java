package com.mtritran.travelplatform.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TourChatResponse {
    /** Câu trả lời văn bản từ AI */
    String answer;
    /** Danh sách tour AI đề xuất (có thể rỗng) */
    List<TourResponse> recommendedTours;
}
