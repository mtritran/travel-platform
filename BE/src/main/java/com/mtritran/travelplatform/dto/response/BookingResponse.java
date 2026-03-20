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
    Integer numberOfGuests;
    BigDecimal totalPrice;
    BookingStatus status;

    String pickupLocationName;
    String pickupLocationAddress;
    Double pickupLatitude;
    Double pickupLongitude;

    BigDecimal depositAmount;
    BigDecimal paidAmount;
    BigDecimal refundAmount;
    BigDecimal depositPercentage;
    java.time.LocalDate tourStartDate;
    java.time.LocalTime tourStartTime;

    boolean reviewed;
    LocalDateTime createdAt;
}
