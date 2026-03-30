package com.mtritran.travelplatform.dto.response;

import com.mtritran.travelplatform.enums.TransactionType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TransactionResponse {
    String id;
    BigDecimal amount;
    TransactionType type;
    String note;
    LocalDateTime createdAt;
    String bookingId;
}
