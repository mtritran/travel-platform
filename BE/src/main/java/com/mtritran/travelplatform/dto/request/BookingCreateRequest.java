package com.mtritran.travelplatform.dto.request;

import jakarta.validation.constraints.Min;
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

    String pickupLocationId;

    @NotNull(message = "INVALID_KEY")
    LocalDate bookingDate;

    @NotNull(message = "INVALID_KEY")
    @Min(value = 1, message = "INVALID_KEY")
    Integer numberOfGuests;
}
