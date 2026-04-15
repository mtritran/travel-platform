package com.mtritran.travelplatform.dto.response;

import com.mtritran.travelplatform.enums.BookingStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BookingResponse {
    String id;
    String bookingCode;
    String userName;
    String userAvatarUrl;
    String tourTitle;
    String guideName;
    String guideAvatarUrl;
    LocalDate bookingDate;
    Integer numberOfGuests;
    BigDecimal totalPrice;
    BookingStatus status;
    String guidePhone;
    String userPhone;

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
    boolean isDisputed;

    Instant payoutAt;
    Instant disputedAt;
    String disputeReason;
    String disputeEvidenceUrl;

    Instant createdAt;
}
