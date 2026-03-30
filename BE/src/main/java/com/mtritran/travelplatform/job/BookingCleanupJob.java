package com.mtritran.travelplatform.job;

import com.mtritran.travelplatform.entity.Booking;
import com.mtritran.travelplatform.enums.BookingStatus;
import com.mtritran.travelplatform.repository.BookingRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class BookingCleanupJob {
    BookingRepository bookingRepository;

    @Scheduled(fixedRate = 60000) // Run every minute
    @Transactional
    public void cleanupExpiredReservations() {
        Instant expiryTime = Instant.now().minus(java.time.Duration.ofMinutes(10));
        
        // Find bookings that are still AWAITING_DEPOSIT but created more than 10 mins ago
        List<Booking> expiredBookings = bookingRepository.findAll().stream()
                .filter(b -> b.getStatus() == BookingStatus.AWAITING_DEPOSIT 
                        && b.getCreatedAt().isBefore(expiryTime))
                .toList();

        if (!expiredBookings.isEmpty()) {
            expiredBookings.forEach(b -> b.setStatus(BookingStatus.CANCELLED));
            bookingRepository.saveAll(expiredBookings);
            System.out.println("Cleaned up " + expiredBookings.size() + " expired reservations.");
        }
    }
}
