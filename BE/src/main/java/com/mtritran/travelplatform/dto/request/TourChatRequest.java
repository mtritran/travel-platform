package com.mtritran.travelplatform.dto.request;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TourChatRequest {
    String question;
    Double latitude;
    Double longitude;
    String address;
    String contextTourId; // ID của tour khách đang xem (nếu có)
    String currentPath;   // Đường dẫn trang hiện tại (ví dụ: /requests)
    List<ChatHistoryItem> history; // Lịch sử trò chuyện

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatHistoryItem {
        String role; // "user" hoặc "assistant"
        String text;
    }
}
