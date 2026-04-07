package com.mtritran.travelplatform.service;

import com.mtritran.travelplatform.entity.Booking;
import com.mtritran.travelplatform.entity.TourRequest;
import com.mtritran.travelplatform.entity.Transaction;
import com.mtritran.travelplatform.entity.User;
import com.mtritran.travelplatform.enums.RoleName;
import com.mtritran.travelplatform.enums.TransactionType;
import com.mtritran.travelplatform.repository.BookingRepository;
import com.mtritran.travelplatform.repository.TourRequestRepository;
import com.mtritran.travelplatform.repository.TransactionRepository;
import com.mtritran.travelplatform.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ScheduledTasks {
    BookingRepository bookingRepository;
    TourRequestRepository tourRequestRepository;
    UserRepository userRepository;
    TransactionRepository transactionRepository;
    NotificationService notificationService;

    /**
     * Chạy mỗi giờ để quét và giải ngân các tour đã hoàn thành hoặc khách hủy trễ (>24h).
     */
    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void processAutoPayouts() {
        log.info("Starting automated payout process at {}", Instant.now());

        // 1. Process Marketplace Bookings
        List<Booking> pendingBookings = bookingRepository.findAllByIsPaidOutFalseAndPayoutAtBeforeAndIsDisputedFalse(Instant.now());
        for (Booking booking : pendingBookings) {
            try {
                payoutBooking(booking);
            } catch (Exception e) {
                log.error("Failed to payout booking {}: {}", booking.getId(), e.getMessage());
            }
        }

        // 2. Process Tour Requests (Custom tours)
        List<TourRequest> pendingRequests = tourRequestRepository.findAllByIsPaidOutFalseAndPayoutAtBeforeAndIsDisputedFalse(Instant.now());
        for (TourRequest request : pendingRequests) {
            try {
                payoutTourRequest(request);
            } catch (Exception e) {
                log.error("Failed to payout tour request {}: {}", request.getId(), e.getMessage());
            }
        }
    }

    private void payoutBooking(Booking booking) {
        BigDecimal totalAmount = booking.getPaidAmount();
        if (totalAmount.compareTo(BigDecimal.ZERO) <= 0) {
            booking.setPaidOut(true);
            bookingRepository.save(booking);
            return;
        }

        BigDecimal platformFee = totalAmount.multiply(new BigDecimal("0.20")).setScale(0, java.math.RoundingMode.HALF_UP);
        BigDecimal guideEarnings = totalAmount.subtract(platformFee);

        // Update Guide
        User guide = booking.getTour().getGuide();
        guide.setBalance((guide.getBalance() != null ? guide.getBalance() : BigDecimal.ZERO).add(guideEarnings));
        userRepository.save(guide);

        // Update Admin
        List<User> admins = userRepository.findAllByRoleName(RoleName.ADMIN);
        if (!admins.isEmpty()) {
            User admin = admins.get(0);
            admin.setBalance((admin.getBalance() != null ? admin.getBalance() : BigDecimal.ZERO).add(platformFee));
            userRepository.save(admin);
            
            notificationService.sendNotification(admin.getId(), 
                "Phí sàn tự động", 
                "Hệ thống đã giải ngân phí 20% từ tour: " + booking.getTour().getTitle() + " — " + platformFee + " VND", 
                "COMMISSION_EARNED");
        }

        // Log Transactions
        transactionRepository.save(Transaction.builder()
                .booking(booking)
                .user(guide)
                .amount(guideEarnings)
                .type(TransactionType.INCOME)
                .note("Giải ngân tự động từ tour: " + booking.getTour().getTitle())
                .build());

        transactionRepository.save(Transaction.builder()
                .booking(booking)
                .user(admins.isEmpty() ? null : admins.get(0))
                .amount(platformFee)
                .type(TransactionType.COMMISSION)
                .note("Thu phí sàn tự động (20%) từ tour: " + booking.getTour().getTitle())
                .build());

        booking.setPaidOut(true);
        bookingRepository.save(booking);

        notificationService.sendNotification(guide.getId(), 
            "Giải ngân thành công", 
            "Tiền từ tour: " + booking.getTour().getTitle() + " đã được chuyển vào ví của bạn.", 
            "PAYOUT_COMPLETED");
    }

    private void payoutTourRequest(TourRequest tourRequest) {
        BigDecimal totalAmount = tourRequest.getPaidAmount();
        if (totalAmount.compareTo(BigDecimal.ZERO) <= 0) {
            tourRequest.setPaidOut(true);
            tourRequestRepository.save(tourRequest);
            return;
        }

        BigDecimal platformFee = totalAmount.multiply(new BigDecimal("0.20")).setScale(0, java.math.RoundingMode.HALF_UP);
        BigDecimal guideEarnings = totalAmount.subtract(platformFee);

        // Update Guide
        User guide = tourRequest.getGuide();
        guide.setBalance((guide.getBalance() != null ? guide.getBalance() : BigDecimal.ZERO).add(guideEarnings));
        userRepository.save(guide);

        // Update Admin
        List<User> admins = userRepository.findAllByRoleName(RoleName.ADMIN);
        if (!admins.isEmpty()) {
            User admin = admins.get(0);
            admin.setBalance((admin.getBalance() != null ? admin.getBalance() : BigDecimal.ZERO).add(platformFee));
            userRepository.save(admin);
        }

        // Log Transactions
        transactionRepository.save(Transaction.builder()
                .tourRequest(tourRequest)
                .user(guide)
                .amount(guideEarnings)
                .type(TransactionType.INCOME)
                .note("Giải ngân tự động từ yêu cầu tour: " + tourRequest.getTitle())
                .build());

        transactionRepository.save(Transaction.builder()
                .tourRequest(tourRequest)
                .user(admins.isEmpty() ? null : admins.get(0))
                .amount(platformFee)
                .type(TransactionType.COMMISSION)
                .note("Thu phí sàn tự động (20%) từ yêu cầu tour: " + tourRequest.getTitle())
                .build());

        tourRequest.setPaidOut(true);
        tourRequestRepository.save(tourRequest);

        notificationService.sendNotification(guide.getId(), 
            "Giải ngân thành công", 
            "Tiền từ yêu cầu tour: " + tourRequest.getTitle() + " đã được chuyển vào ví của bạn.", 
            "PAYOUT_COMPLETED");
    }
}
