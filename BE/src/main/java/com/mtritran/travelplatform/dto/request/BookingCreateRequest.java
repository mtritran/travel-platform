package com.mtritran.travelplatform.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BookingCreateRequest {
    @NotBlank(message = "TOUR_NOT_FOUND")
    String tourId;

    @NotNull(message = "UNCATEGORIZED_EXCEPTION")
    LocalDate bookingDate;
}
