package com.mtritran.travelplatform.dto.response;

import com.mtritran.travelplatform.enums.BookingStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BookingResponse {
    String id;
    String userName;
    String tourTitle;
    String guideName;
    LocalDate bookingDate;
    BigDecimal totalPrice;
    BookingStatus status;
    LocalDateTime createdAt;
}
