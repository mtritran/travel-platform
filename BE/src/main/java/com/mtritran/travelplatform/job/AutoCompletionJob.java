package com.mtritran.travelplatform.job;

import com.mtritran.travelplatform.entity.Booking;
import com.mtritran.travelplatform.enums.BookingStatus;
import com.mtritran.travelplatform.repository.BookingRepository;
import com.mtritran.travelplatform.service.BookingService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AutoCompletionJob {
    BookingRepository bookingRepository;
    BookingService bookingService;

    // Run every hour
    @Scheduled(fixedRate = 3600000)
    public void autoCompleteFinishedTours() {
        // Use Vietnam timezone to match BookingService logic
        ZoneId vnZone = ZoneId.of("Asia/Ho_Chi_Minh");
        LocalDateTime now = LocalDateTime.now(vnZone);

        // Find all PAID_FULL bookings that might be finished
        List<Booking> paidBookings = bookingRepository.findAll().stream()
                .filter(b -> b.getStatus() == BookingStatus.PAID_FULL)
                .toList();

        int completedCount = 0;

        for (Booking booking : paidBookings) {
            LocalTime timeToCheck = booking.getTour().getEndTime() != null
                    ? booking.getTour().getEndTime()
                    : (booking.getStartTime() != null ? booking.getStartTime() : LocalTime.of(23, 59));

            LocalDateTime tourEnd = LocalDateTime.of(booking.getBookingDate(), timeToCheck);

            // If 24 hours have passed since the tour ended, and no dispute has been raised
            // (Assuming disputes would change the status from PAID_FULL to something else or cancel)
            if (now.isAfter(tourEnd.plusHours(24))) {
                try {
                    // Call completeTour directly. Since it checks the currently logged-in user,
                    // we need a specialized completeTour method in BookingService for the system,
                    // or we handle the logic here/bypass security check.
                    // For now we will add completeTourBySystem to BookingService.
                    bookingService.completeTourBySystem(booking.getId());
                    completedCount++;
                } catch (Exception e) {
                    System.err.println("Failed to auto-complete booking " + booking.getId() + ": " + e.getMessage());
                }
            }
        }

        if (completedCount > 0) {
            System.out.println("AutoCompletionJob: Successfully marked " + completedCount + " bookings as COMPLETED.");
        }
    }
}
