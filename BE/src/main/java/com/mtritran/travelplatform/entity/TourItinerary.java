package com.mtritran.travelplatform.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TourItinerary {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tour_id")
    Tour tour;

    String timeSlot; // Ví dụ: "08:00", "08:00 - 09:00"
    
    @Column(columnDefinition = "TEXT")
    String activity; // Tên hoạt động/địa điểm
    
    @Column(columnDefinition = "TEXT")
    String description; // Mô tả chi tiết hoạt động
    
    @Column(columnDefinition = "TEXT")
    String imageUrl; // Hình ảnh minh họa cho mốc này
    
    int stepOrder; // Thứ tự hiển thị
}
