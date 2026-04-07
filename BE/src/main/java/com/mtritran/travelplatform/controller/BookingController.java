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
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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

    @Operation(summary = "File a dispute", description = "User files a dispute for a tour within 24h of completion.")
    @PostMapping(value = "/{id}/dispute", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<BookingResponse> fileDispute(
            @PathVariable String id,
            @RequestParam String reason,
            @RequestParam(name = "files", required = false) List<MultipartFile> files) {
        return ApiResponse.<BookingResponse>builder()
                .result(bookingService.fileDispute(id, reason, files))
                .build();
    }

    @Operation(summary = "Get booking by id", description = "User or guide views details of a specific booking.")
    @GetMapping("/{id}")
    public ApiResponse<BookingResponse> getBooking(@PathVariable String id) {
        return ApiResponse.<BookingResponse>builder()
                .result(bookingService.getBookingById(id))
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
    @PreAuthorize("hasRole('GUIDE')")
    @GetMapping("/guide-bookings")
    public ApiResponse<List<BookingResponse>> getGuideBookings() {
        return ApiResponse.<List<BookingResponse>>builder()
                .result(bookingService.getGuideBookings())
                .build();
    }

    @Operation(summary = "Update booking status", description = "Guide confirms or cancels a booking.")
    @PreAuthorize("hasRole('GUIDE')")
    @PostMapping("/{id}/status")
    public ApiResponse<BookingResponse> updateStatus(@PathVariable String id, @RequestParam BookingStatus status) {
        return ApiResponse.<BookingResponse>builder()
                .result(bookingService.updateStatus(id, status))
                .build();
    }

    @Operation(summary = "Cancel booking", description = "User or guide cancels a booking with refund logic.")
    @PostMapping("/{id}/cancel")
    public ApiResponse<BookingResponse> cancelBooking(@PathVariable String id) {
        return ApiResponse.<BookingResponse>builder()
                .result(bookingService.cancelBooking(id))
                .build();
    }

    @Operation(summary = "Pay deposit", description = "Customer pays the required deposit amount.")
    @PostMapping("/{id}/pay")
    public ApiResponse<BookingResponse> payDeposit(@PathVariable String id) {
        return ApiResponse.<BookingResponse>builder()
                .result(bookingService.payDeposit(id))
                .build();
    }

    @Operation(summary = "Pay remaining balance", description = "Customer pays the rest of the tour price.")
    @PostMapping("/{id}/pay-remaining")
    public ApiResponse<BookingResponse> payRemaining(@PathVariable String id) {
        return ApiResponse.<BookingResponse>builder()
                .result(bookingService.payRemaining(id))
                .build();
    }

    @Operation(summary = "Complete tour", description = "Guide marks tour as completed and receives funds.")
    @PreAuthorize("hasRole('GUIDE')")
    @PostMapping("/{id}/complete")
    public ApiResponse<BookingResponse> completeTour(@PathVariable String id) {
        return ApiResponse.<BookingResponse>builder()
                .result(bookingService.completeTour(id))
                .build();
    }

    @Operation(summary = "Admin: Get disputed bookings", description = "Admin views all active disputes.")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/disputes")
    public ApiResponse<List<BookingResponse>> getDisputedBookings() {
        return ApiResponse.<List<BookingResponse>>builder()
                .result(bookingService.getDisputedBookings())
                .build();
    }

    @Operation(summary = "Admin: Resolve dispute", description = "Admin resolves a dispute by favoring either guide or customer.")
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/disputes/{id}/resolve")
    public ApiResponse<BookingResponse> resolveDispute(
            @PathVariable String id,
            @RequestParam String action,
            @RequestParam(required = false, defaultValue = "100") int refundPercentage,
            @RequestParam(required = false, defaultValue = "") String note) {
        return ApiResponse.<BookingResponse>builder()
                .result(bookingService.resolveDispute(id, action, refundPercentage, note))
                .build();
    }
}
