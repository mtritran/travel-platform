package com.mtritran.travelplatform.controller;

import com.mtritran.travelplatform.dto.request.BookingCreateRequest;
import com.mtritran.travelplatform.dto.response.ApiResponse;
import com.mtritran.travelplatform.dto.response.BookingResponse;
import com.mtritran.travelplatform.enums.BookingStatus;
import com.mtritran.travelplatform.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "Booking", description = "APIs for tour bookings management")
public class BookingController {
    BookingService bookingService;

    @Operation(summary = "Book a tour", description = "User books a specific tour from marketplace.")
    @PostMapping
    public ApiResponse<BookingResponse> bookTour(@Valid @RequestBody BookingCreateRequest request) {
        return ApiResponse.<BookingResponse>builder()
                .result(bookingService.createBooking(request))
                .build();
    }

    @Operation(summary = "Get my bookings", description = "User views their own tour bookings.")
    @GetMapping("/my-bookings")
    public ApiResponse<List<BookingResponse>> getMyBookings() {
        return ApiResponse.<List<BookingResponse>>builder()
                .result(bookingService.getMyBookings())
                .build();
    }

    @Operation(summary = "Get guide bookings", description = "Guide views bookings made for their tours.")
    @PreAuthorize("hasAuthority('GUIDE')")
    @GetMapping("/guide-bookings")
    public ApiResponse<List<BookingResponse>> getGuideBookings() {
        return ApiResponse.<List<BookingResponse>>builder()
                .result(bookingService.getGuideBookings())
                .build();
    }

    @Operation(summary = "Update booking status", description = "Guide confirms or cancels a booking.")
    @PreAuthorize("hasAuthority('GUIDE')")
    @PostMapping("/{id}/status")
    public ApiResponse<BookingResponse> updateStatus(@PathVariable String id, @RequestParam BookingStatus status) {
        return ApiResponse.<BookingResponse>builder()
                .result(bookingService.updateStatus(id, status))
                .build();
    }
}
