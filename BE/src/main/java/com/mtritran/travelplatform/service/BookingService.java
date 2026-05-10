package com.mtritran.travelplatform.service;

import com.mtritran.travelplatform.dto.request.BookingCreateRequest;
import com.mtritran.travelplatform.dto.response.BookingResponse;
import com.mtritran.travelplatform.entity.Booking;
import com.mtritran.travelplatform.entity.Location;
import com.mtritran.travelplatform.entity.Tour;
import com.mtritran.travelplatform.entity.Transaction;
import com.mtritran.travelplatform.entity.User;
import com.mtritran.travelplatform.enums.BookingStatus;
import com.mtritran.travelplatform.enums.RoleName;
import com.mtritran.travelplatform.enums.TransactionType;
import com.mtritran.travelplatform.exception.AppException;
import com.mtritran.travelplatform.exception.ErrorCode;
import com.mtritran.travelplatform.mapper.BookingMapper;
import com.mtritran.travelplatform.repository.BookingRepository;
import com.mtritran.travelplatform.repository.LocationRepository;
import com.mtritran.travelplatform.repository.ReviewRepository;
import com.mtritran.travelplatform.repository.TransactionRepository;
import com.mtritran.travelplatform.repository.UserRepository;
import com.mtritran.travelplatform.repository.TourRepository;
import com.mtritran.travelplatform.repository.TourRequestRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class BookingService {
    BookingRepository bookingRepository;
    UserRepository userRepository;
    TourRepository tourRepository;
    LocationRepository locationRepository;
    BookingMapper bookingMapper;
    NotificationService notificationService;
    ReviewRepository reviewRepository;
    TransactionRepository transactionRepository;
    PenaltyService penaltyService;
    StorageService storageService;
    TourRequestRepository tourRequestRepository;

    public BookingResponse getBookingById(String id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        // Check ownership: only user who booked OR the guide of the tour OR admin
        boolean isOwner = booking.getUser().getId().equals(currentUser.getId());
        boolean isGuide = booking.getTour().getGuide().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRoles().stream()
                .anyMatch(r -> r.getName() == RoleName.ADMIN);

        if (!isOwner && !isGuide && !isAdmin) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        return mapToResponse(booking);
    }

    private BookingResponse mapToResponse(Booking booking) {
        BookingResponse response = bookingMapper.toResponse(booking);
        response.setReviewed(reviewRepository.existsByBookingId(booking.getId()));
        
        // Ensure payoutAt is provided for frontend dispute logic
        if (response.getPayoutAt() == null && booking.getTour().getEndDate() != null) {
            LocalDateTime endDateTime = LocalDateTime.of(booking.getTour().getEndDate(),
                    booking.getTour().getEndTime() != null ? booking.getTour().getEndTime() : LocalTime.of(23, 59));
            response.setPayoutAt(endDateTime.atZone(ZoneId.of("Asia/Ho_Chi_Minh")).toInstant()
                    .plus(24, ChronoUnit.HOURS));
        }
        
        return response;
    }

    @Transactional
    public BookingResponse createBooking(BookingCreateRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));
 
        if (user.getPhone() == null || user.getPaymentPin() == null) {
            throw new AppException(ErrorCode.IDENTITY_NOT_UPGRADED);
        }

        // Check if customer is banned from booking
        if (user.getCustomerBannedUntil() != null && user.getCustomerBannedUntil().isAfter(Instant.now())) {
            throw new AppException(ErrorCode.USER_BANNED);
        }

        // Concurrency handling: lock the tour row
        Tour tour = tourRepository.findByIdWithLock(request.getTourId())
                .orElseThrow(() -> new AppException(ErrorCode.TOUR_NOT_FOUND));

        if (tour.getGuide().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.CANNOT_BOOK_OWN_TOUR);
        }

        // Validate booking date and time: cannot book past tours or tours past cutoff
        ZoneId vnZone = ZoneId.of("Asia/Ho_Chi_Minh");
        LocalDateTime now = LocalDateTime.now(vnZone);
        // Use guide-defined cutoff minutes (defaulting to 60 if null)
        int cutoff = tour.getBookingCutoffMinutes() != null ? tour.getBookingCutoffMinutes() : 60;
        // Technical 5-minute buffer still applied under the hood
        LocalDateTime cutoffPoint = LocalDateTime.of(request.getBookingDate(), tour.getStartTime())
                .minusMinutes(cutoff);

        if (now.isAfter(cutoffPoint)) {
            throw new AppException(ErrorCode.INVALID_TOUR_DATE);
        }

        // Duplicate booking check: customer cannot rebook if already has active booking
        // on this tour
        if (bookingRepository.hasActiveBookingForTour(user, tour.getId())) {
            throw new AppException(ErrorCode.ALREADY_HAS_ACTIVE_BOOKING);
        }

        // Schedule overlap check: customer cannot be in two tours at the same time
        LocalTime tourStart = tour.getStartTime();
        LocalTime tourEnd = tour.getEndTime() != null ? tour.getEndTime() : tourStart.plusHours(4); // Default 4h if not set

        boolean hasOverlapInBookings = bookingRepository.existsOverlappingBooking(
                user, request.getBookingDate(), tourStart, tourEnd);
        
        boolean hasOverlapInRequests = tourRequestRepository.existsOverlappingRequest(
                user, request.getBookingDate(), tourStart, tourEnd);

        if (hasOverlapInBookings || hasOverlapInRequests) {
            throw new AppException(ErrorCode.OVERLAPPING_SCHEDULE);
        }

        // Capacity check: count confirmed AND active reservations (within 10 mins)
        if (tour.getMaxGuests() != null) {
            Instant expiryTime = Instant.now().minus(Duration.ofMinutes(10));
            Integer currentlyOccupied = bookingRepository.sumOccupiedSlots(tour.getId(),
                    request.getBookingDate(), tour.getStartTime(), expiryTime);
            if (currentlyOccupied == null)
                currentlyOccupied = 0;

            if (currentlyOccupied + request.getNumberOfGuests() > tour.getMaxGuests()) {
                throw new AppException(ErrorCode.EXCEED_MAX_GUESTS);
            }
        }

        Location pickupLocation = null;
        if (request.getPickupLocationId() != null && !request.getPickupLocationId().isBlank()) {
            pickupLocation = locationRepository.findById(request.getPickupLocationId())
                    .orElseThrow(() -> new AppException(ErrorCode.LOCATION_NOT_FOUND));
        }

        //Tong tien can thanh toan
        BigDecimal pricePerGuest = tour.getPrice();
        BigDecimal total = pricePerGuest.multiply(BigDecimal.valueOf(request.getNumberOfGuests()));

        // Phan tram giu cho (mac dinh 100% cho mo hinh thanh toan truoc)
        BigDecimal depositPerc = tour.getDepositPercentage() != null ? tour.getDepositPercentage()
                : BigDecimal.valueOf(100);

        //Tinh tien coc
        BigDecimal depositAmount = total.multiply(depositPerc).divide(BigDecimal.valueOf(100), 0,
                RoundingMode.HALF_UP);

        Booking booking = Booking.builder()
                .user(user)
                .tour(tour)
                .bookingDate(request.getBookingDate())
                .startTime(tour.getStartTime())
                .numberOfGuests(request.getNumberOfGuests())
                .totalPrice(total)
                .depositAmount(depositAmount)
                .paidAmount(BigDecimal.ZERO)
                .status(BookingStatus.AWAITING_DEPOSIT)
                .pickupLocation(pickupLocation)
                .build();

        Booking savedBooking = bookingRepository.save(booking);

        // Notify Guide real-time
        notificationService.sendNotification(tour.getGuide().getId(), 
                "Booking mới", 
                "Bạn có một Booking mới cho tour: " + tour.getTitle(), 
                "NEW_BOOKING");

        return mapToResponse(savedBooking);
    }

    public List<BookingResponse> getMyBookings() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        return bookingRepository.findAllByUserOrderByCreatedAtDesc(user).stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<BookingResponse> getGuideBookings() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User guide = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        return bookingRepository.findAllByTour_GuideOrderByCreatedAtDesc(guide).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public BookingResponse updateStatus(String bookingId, BookingStatus status) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        // Basic check to ensure only the guide of the tour can confirm/cancel
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!booking.getTour().getGuide().getEmail().equals(email)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        booking.setStatus(status);
        Booking saved = bookingRepository.save(booking);

        // Notify Customer real-time
        notificationService.sendNotification(booking.getUser().getId(), 
                "Cập nhật đơn hàng", 
                "Trạng thái đơn hàng " + booking.getTour().getTitle() + " đã chuyển sang " + status, 
                "BOOKING_STATUS_UPDATE");

        return mapToResponse(saved);
    }

    @Transactional
    public BookingResponse cancelBooking(String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        // Check ownership (either the user who booked or the guide)
        boolean isGuide = booking.getTour().getGuide().getEmail().equals(email);
        boolean isCustomer = booking.getUser().getEmail().equals(email);

        if (!isGuide && !isCustomer) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.COMPLETED) {
            return mapToResponse(booking);
        }

        LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        LocalDateTime tourStart = LocalDateTime.of(booking.getBookingDate(),
                booking.getTour().getStartTime() != null ? booking.getTour().getStartTime() : LocalTime.of(0, 0));

        BigDecimal refundAmount = BigDecimal.ZERO;
        BigDecimal penaltyFee = BigDecimal.ZERO;

        if (isGuide) {
            // Guide cancels -> 100% refund of paid amount
            refundAmount = booking.getPaidAmount();
            // Penalty for guide
            penaltyService.addPenalty(booking.getTour().getGuide().getId(), 1,
                    "Bạn đã hủy tour '" + booking.getTour().getTitle() + "' mà khách đã đặt.");
            
            notificationService.sendNotification(booking.getUser().getId(), 
                    "HDV đã hủy đặt tour", 
                    "Hướng dẫn viên " + booking.getTour().getGuide().getFullName() + " đã hủy việc đặt tour cho '" + booking.getTour().getTitle() + "'.", 
                    "BOOKING_CANCELLED");
        } else {
            // Customer cancels -> 3-tier refund policy based on deposit amount
            Duration timeUntilTour = Duration.between(now, tourStart);
            long hoursLeft = timeUntilTour.toHours();

            System.out.println("DEBUG CANCEL: Now=" + now + ", Start=" + tourStart + ", MinutesLeft=" + hoursLeft);

            // Tinh phi phat dua tren 30% tong gia tri (giu nguyen muc bu tien cu cho HDV)
            BigDecimal penaltyBasis = booking.getTotalPrice().multiply(new BigDecimal("0.30"));

            if (hoursLeft >= 48) {
                // Early cancellation (> 48h): 100% refund
                refundAmount = booking.getPaidAmount();
                penaltyFee = BigDecimal.ZERO;
            } else if (hoursLeft >= 24) {
                // Mid cancellation (24-48h): 50% of penaltyBasis is penalty, rest is refunded
                penaltyFee = penaltyBasis.multiply(new BigDecimal("0.50"))
                        .setScale(0, RoundingMode.HALF_UP);
                refundAmount = booking.getPaidAmount().subtract(penaltyFee).max(BigDecimal.ZERO);
                penaltyFee = booking.getPaidAmount().subtract(refundAmount);

                penaltyService.addCustomerPenalty(user.getId(), "Hủy tour từ 24-48h trước khởi hành: " + booking.getTour().getTitle());
                booking.setPayoutAt(Instant.now());
            } else {
                // Late cancellation (< 24h): 100% of deposit is penalty, rest is refunded (if any)
                penaltyFee = penaltyBasis;
                refundAmount = booking.getPaidAmount().subtract(penaltyFee).max(BigDecimal.ZERO);
                penaltyFee = booking.getPaidAmount().subtract(refundAmount);

                penaltyService.addCustomerPenalty(user.getId(), "Hủy tour muộn (<24h): " + booking.getTour().getTitle());
                booking.setPayoutAt(Instant.now());
            }

            notificationService.sendNotification(booking.getTour().getGuide().getId(), 
                    "Khách đã hủy đặt tour", 
                    "Khách hàng " + user.getFullName() + " đã hủy việc đặt tour cho '" + booking.getTour().getTitle() + "'.", 
                    "BOOKING_CANCELLED");
        }

        // Process actual refund to customer wallet
        if (refundAmount.compareTo(BigDecimal.ZERO) > 0) {
            User customer = booking.getUser();
            customer.setBalance((customer.getBalance() != null ? customer.getBalance() : BigDecimal.ZERO).add(refundAmount));
            userRepository.save(customer);

            // Log Refund Transaction
            transactionRepository.save(Transaction.builder()
                    .booking(booking)
                    .user(customer)
                    .amount(refundAmount)
                    .type(TransactionType.REFUND)
                    .note("Hoàn tiền hủy tour: " + booking.getTour().getTitle() + (isGuide ? " (HDV hủy)" : " (Khách hủy trễ/đúng hạn)"))
                    .build());
            
            notificationService.sendNotification(customer.getId(), 
                    "Cập nhật hoàn tiền", 
                    "Bạn được hoàn " + refundAmount + " VND sau khi hủy tour (Phí hủy: " + penaltyFee + " VND)", 
                    "REFUND_PROCESSED");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setPaidAmount(penaltyFee); // Keep only penalty in escrow for platform
        booking.setRefundAmount(refundAmount);
        
        Booking saved = bookingRepository.save(booking);

        return mapToResponse(saved);
    }

    @Transactional
    public void cancelBySystem(String bookingId, String reason) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.COMPLETED) {
            return;
        }

        BigDecimal refundAmount = booking.getPaidAmount();

        if (refundAmount.compareTo(BigDecimal.ZERO) > 0) {
            User customer = booking.getUser();
            customer.setBalance((customer.getBalance() != null ? customer.getBalance() : BigDecimal.ZERO).add(refundAmount));
            userRepository.save(customer);

            transactionRepository.save(Transaction.builder()
                    .booking(booking)
                    .user(customer)
                    .amount(refundAmount)
                    .type(TransactionType.REFUND)
                    .note("Hệ thống hủy tour: " + booking.getTour().getTitle() + " (" + reason + ")")
                    .build());

            notificationService.sendNotification(customer.getId(),
                    "Thông báo hủy tour",
                    "Tour '" + booking.getTour().getTitle() + "' đã bị hệ thống hủy do " + reason + ". Bạn được hoàn trả " + refundAmount + " VND.",
                    "TOUR_CANCELLED_SYSTEM");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setRefundAmount(refundAmount);
        booking.setPaidAmount(BigDecimal.ZERO);
        bookingRepository.save(booking);
    }

    // Money distribution now handled by ScheduledTasks.java using payoutAt

    // Payout and Penalty distribution logic moved to ScheduledTasks.java using payoutAt

    //Thanh toan coc
    @Transactional
    public BookingResponse payDeposit(String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!booking.getUser().getEmail().equals(email)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        if (booking.getStatus() != BookingStatus.AWAITING_DEPOSIT) {
            throw new AppException(ErrorCode.INVALID_BOOKING_STATUS);
        }

        booking.setPaidAmount(booking.getDepositAmount());
        if (booking.getPaidAmount().compareTo(booking.getTotalPrice()) >= 0) {
            booking.setStatus(BookingStatus.PAID_FULL);
        } else {
            booking.setStatus(BookingStatus.CONFIRMED);
        }
        // Set Payout time: Tour end time + 24 hours (Dispute window)
        LocalDateTime endDateTime = LocalDateTime.of(booking.getTour().getEndDate(),
                booking.getTour().getEndTime());
        booking.setPayoutAt(endDateTime.atZone(ZoneId.systemDefault()).toInstant()
                .plus(24, ChronoUnit.HOURS));
        
        Booking saved = bookingRepository.save(booking);

        // Notify Guide real-time
        notificationService.sendNotification(booking.getTour().getGuide().getId(), 
                "Thanh toán mới", 
                "Khách hàng đã thanh toán cho tour: " + booking.getTour().getTitle(), 
                "PAYMENT_CONFIRMED");

        return mapToResponse(saved);
    }

    /**
     * Gọi sau khi VNPAY trả về và chữ ký đã được xác thực — không dùng JWT vì phiên
     * có thể hết hạn
     * khi user quay lại từ cổng thanh toán.
     */
    @Transactional
    public void applyVnpayDepositSuccess(String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));
        if (booking.getStatus() != BookingStatus.AWAITING_DEPOSIT) {
            if (booking.getStatus() == BookingStatus.CONFIRMED || booking.getStatus() == BookingStatus.PAID_FULL) {
                return;
            }
            throw new AppException(ErrorCode.INVALID_BOOKING_STATUS);
        }
        booking.setPaidAmount(booking.getDepositAmount());
        if (booking.getPaidAmount().compareTo(booking.getTotalPrice()) >= 0) {
            booking.setStatus(BookingStatus.PAID_FULL);
        } else {
            booking.setStatus(BookingStatus.CONFIRMED);
        }
        
        // Set Payout time: Tour end time + 24 hours (Dispute window)
        LocalDateTime endDateTime = LocalDateTime.of(booking.getTour().getEndDate(),
                booking.getTour().getEndTime());
        booking.setPayoutAt(endDateTime.atZone(ZoneId.systemDefault()).toInstant()
                .plus(24, ChronoUnit.HOURS));

        Booking saved = bookingRepository.save(booking);
        // Log REVENUE to Admin (Platform intermediary)
        User admin = userRepository.findAllByRoleName(RoleName.ADMIN).get(0);
        transactionRepository.save(Transaction.builder()
                .booking(saved)
                .user(admin)
                .amount(booking.getDepositAmount())
                .type(TransactionType.REVENUE)
                .note("Thanh toán tiền tour: " + booking.getTour().getTitle())
                .build());
        notificationService.sendNotification(booking.getTour().getGuide().getId(), 
                "Thanh toán mới", 
                "Khách hàng đã thanh toán cho tour: " + booking.getTour().getTitle(), 
                "PAYMENT_CONFIRMED");
    }

    @Transactional
    public void applyVnpayRemainingSuccess(String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));
        if (booking.getStatus() == BookingStatus.PAID_FULL) {
            return;
        }
        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new AppException(ErrorCode.INVALID_BOOKING_STATUS);
        }
        BigDecimal payAmount = booking.getTotalPrice().subtract(booking.getPaidAmount());
        booking.setPaidAmount(booking.getTotalPrice());
        booking.setStatus(BookingStatus.PAID_FULL);
        Booking saved = bookingRepository.save(booking);
        // Log REVENUE to Admin (Platform intermediary)
        User admin = userRepository.findAllByRoleName(RoleName.ADMIN).get(0);
        transactionRepository.save(Transaction.builder()
                .booking(saved)
                .user(admin)
                .amount(payAmount)
                .type(TransactionType.REVENUE)
                .note("Thanh toán nốt số tiền còn lại cho tour: " + booking.getTour().getTitle())
                .build());
        notificationService.sendNotification(booking.getTour().getGuide().getId(), 
                "Thanh toán hoàn tất", 
                "Khách hàng đã thanh toán đủ 100% cho tour: " + booking.getTour().getTitle(), 
                "PAYMENT_COMPLETED");
    }

    @Transactional
    public BookingResponse payRemaining(String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!booking.getUser().getEmail().equals(email)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new AppException(ErrorCode.INVALID_BOOKING_STATUS);
        }

        BigDecimal payAmount = booking.getTotalPrice().subtract(booking.getPaidAmount());
        booking.setPaidAmount(booking.getTotalPrice());
        booking.setStatus(BookingStatus.PAID_FULL);
        Booking saved = bookingRepository.save(booking);

        // Log REVENUE to Admin (Platform intermediary)
        User admin = userRepository.findAllByRoleName(RoleName.ADMIN).get(0);
        transactionRepository.save(Transaction.builder()
                .booking(saved)
                .user(admin)
                .amount(payAmount)
                .type(TransactionType.REVENUE)
                .note("Thanh toán nốt số tiền còn lại cho tour: " + booking.getTour().getTitle())
                .build());

        // Notify Guide real-time
        notificationService.sendNotification(booking.getTour().getGuide().getId(), 
                "Thanh toán hoàn tất", 
                "Khách hàng đã thanh toán đủ 100% cho tour: " + booking.getTour().getTitle(), 
                "PAYMENT_COMPLETED");

        return mapToResponse(saved);
    }


    @Transactional
    public BookingResponse completeTour(String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!booking.getTour().getGuide().getEmail().equals(email)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        if (booking.getStatus() != BookingStatus.PAID_FULL) {
            throw new AppException(ErrorCode.INVALID_BOOKING_STATUS);
        }

        // Use Vietnam timezone to avoid UTC mismatch on cloud servers
        ZoneId vnZone = ZoneId.of("Asia/Ho_Chi_Minh");
        LocalDateTime now = LocalDateTime.now(vnZone);

        // Determine the end time of the tour
        LocalTime timeToCheck = booking.getTour().getEndTime() != null
                ? booking.getTour().getEndTime()
                : (booking.getStartTime() != null ? booking.getStartTime() : LocalTime.of(23, 59));

        LocalDateTime tourEnd = LocalDateTime.of(booking.getBookingDate(), timeToCheck);

        if (now.isBefore(tourEnd)) {
            throw new AppException(ErrorCode.TOUR_NOT_STARTED_YET); // The message correctly translates to "Chưa bắt
                                                                    // đầu/kết thúc"
        }

        booking.setStatus(BookingStatus.COMPLETED);
        
        // Ensure payoutAt is set (24h after tour end) if not already set
        if (booking.getPayoutAt() == null) {
            LocalDateTime endTime = LocalDateTime.of(booking.getBookingDate(),
                booking.getTour().getEndTime() != null ? booking.getTour().getEndTime() : LocalTime.of(23, 59));
            booking.setPayoutAt(endTime.atZone(ZoneId.of("Asia/Ho_Chi_Minh")).toInstant()
                .plus(24, ChronoUnit.HOURS));
        }

//        booking.setPayoutAt(Instant.now().plus(5, ChronoUnit.SECONDS));

        Booking saved = bookingRepository.save(booking);

        // Notify Customer real-time
        notificationService.sendNotification(booking.getUser().getId(), 
                "Tour đã hoàn thành", 
                "Tour " + booking.getTour().getTitle() + " đã hoàn thành. Cảm ơn bạn!", 
                "TOUR_COMPLETED");

        return mapToResponse(saved);
    }

    /**
     * Tự động hoàn thành tour bởi hệ thống sau một khoảng thời gian (VD: 24h).
     */
    @Transactional
    public void completeTourBySystem(String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        if (booking.getStatus() != BookingStatus.PAID_FULL) {
            return;
        }

        booking.setStatus(BookingStatus.COMPLETED);
        bookingRepository.save(booking);

        // Notify Customer and Guide
        notificationService.sendNotification(booking.getUser().getId(), 
                "Tour tự động hoàn thành", 
                "Tour " + booking.getTour().getTitle() + " đã tự động hoàn thành. Đừng quên đánh giá nhé!", 
                "TOUR_COMPLETED");

        notificationService.sendNotification(booking.getTour().getGuide().getId(), 
                "Tour tự động hoàn thành", 
                "Tour " + booking.getTour().getTitle() + " đã tự động chuyển sang hoàn thành.", 
                "TOUR_COMPLETED");
    }

    /**
     * Admin force cancel and refund a specific percentage to the customer,
     * useful for resolving disputes (e.g. guide failed during the tour).
     */
    @Transactional
    public BookingResponse adminForceCancel(String bookingId, int refundPercentage) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User adminUser = userRepository.findByEmail(email).orElseThrow();
        boolean isAdmin = adminUser.getRoles().stream().anyMatch(r -> r.getName() == RoleName.ADMIN);
        
        if (!isAdmin) {
             throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.COMPLETED) {
            throw new AppException(ErrorCode.INVALID_BOOKING_STATUS);
        }

        BigDecimal refund = booking.getPaidAmount()
                .multiply(BigDecimal.valueOf(refundPercentage))
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);

        booking.setRefundAmount(refund);
        booking.setStatus(BookingStatus.CANCELLED);
        Booking saved = bookingRepository.save(booking);

        if (refund.compareTo(BigDecimal.ZERO) > 0) {
            User target = userRepository.findById(booking.getUser().getId()).orElseThrow();
            BigDecimal currentBalance = target.getBalance() != null ? target.getBalance() : BigDecimal.ZERO;
            target.setBalance(currentBalance.add(refund));
            userRepository.save(target);

            transactionRepository.save(Transaction.builder()
                    .booking(saved)
                    .user(target)
                    .amount(refund)
                    .type(TransactionType.REFUND)
                    .note("Admin hoàn tiền (" + refundPercentage + "%): " + booking.getTour().getTitle())
                    .build());

            notificationService.sendNotification(target.getId(),
                    "Hoàn tiền từ Admin", 
                    "Bạn được hoàn " + refund + " VND vào ví do Admin xử lý sự cố tour: " + booking.getTour().getTitle(), 
                    "REFUND_RECEIVED");
        }

        return mapToResponse(saved);
    }

    @Transactional
    public BookingResponse fileDispute(String bookingId, String reason, List<MultipartFile> files) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!booking.getUser().getEmail().equals(email)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        if (booking.getStatus() != BookingStatus.COMPLETED && 
            booking.getStatus() != BookingStatus.PAID_FULL &&
            booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new AppException(ErrorCode.INVALID_BOOKING_STATUS);
        }

        if (booking.isDisputed()) {
            throw new AppException(ErrorCode.ALREADY_DISPUTED);
        }

        // Verify timing: must be before payoutAt (if scheduled)
        if (booking.getPayoutAt() != null && Instant.now().isAfter(booking.getPayoutAt())) {
            throw new AppException(ErrorCode.DISPUTE_WINDOW_EXPIRED);
        }

        booking.setDisputed(true);
        booking.setDisputeReason(reason);
        
        if (files != null && !files.isEmpty()) {
            List<String> paths = new ArrayList<>();
            for (MultipartFile file : files) {
                if (file != null && !file.isEmpty()) {
                    String evidencePath = storageService.saveFile(file, "disputes/" + booking.getId());
                    paths.add(evidencePath);
                }
            }
            if (!paths.isEmpty()) {
                booking.setDisputeEvidenceUrl(String.join(";", paths));
            }
        }
        
        booking.setDisputedAt(Instant.now());
        
        notificationService.sendNotification(booking.getTour().getGuide().getId(),
                "Khiếu nại mới từ khách hàng",
                "Đơn hàng " + booking.getBookingCode() + " bị khiếu nại. Thanh toán đang bị tạm dừng để Admin kiểm tra.",
                "BOOKING_DISPUTED");

        // Notify Admins
        List<User> admins = userRepository.findAllByRoleName(RoleName.ADMIN);
        for (User admin : admins) {
            notificationService.sendNotification(admin.getId(), 
                "Khiếu nại mới cần xử lý", 
                "Khách hàng đã gửi khiếu nại cho tour: " + booking.getTour().getTitle(), 
                "NEW_DISPUTE");
        }

        return mapToResponse(bookingRepository.save(booking));
    }

    public List<BookingResponse> getDisputedBookings() {
        return bookingRepository.findAllByIsDisputedTrue().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public BookingResponse resolveDispute(String id, String action, int refundPercentage, String adminNote) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        if (!booking.isDisputed()) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }

        if ("RELEASE".equalsIgnoreCase(action)) {
            // Admin favors Guide: Un-freeze
            booking.setDisputed(false);
            
            notificationService.sendNotification(booking.getUser().getId(),
                    "Phán quyết khiếu nại",
                    "Khiếu nại đơn hàng " + booking.getBookingCode() + " của bạn đã được Admin bác bỏ sau khi xem xét bằng chứng." 
                        + (adminNote != null && !adminNote.isEmpty() ? " Ghi chú: " + adminNote : ""),
                    "DISPUTE_REJECTED");
                    
            notificationService.sendNotification(booking.getTour().getGuide().getId(),
                    "Khiếu nại đã được bác bỏ",
                    "Chúc mừng! Khiếu nại đơn hàng " + booking.getBookingCode() + " đã được Admin bác bỏ. Bạn sẽ nhận được thanh toán sớm.",
                    "DISPUTE_RESOLVED_RELEASE");
        } else if ("REFUND".equalsIgnoreCase(action)) {
            // Validate percentage
            if (refundPercentage < 1 || refundPercentage > 100) {
                refundPercentage = 100;
            }
            
            BigDecimal refundAmount = booking.getPaidAmount()
                    .multiply(BigDecimal.valueOf(refundPercentage))
                    .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
            
            User user = booking.getUser();
            user.setBalance((user.getBalance() != null ? user.getBalance() : BigDecimal.ZERO).add(refundAmount));
            userRepository.save(user);

            String txNote = "Hoàn tiền " + refundPercentage + "% từ phán quyết khiếu nại: " + booking.getBookingCode();
            if (adminNote != null && !adminNote.isEmpty()) {
                txNote += " — " + adminNote;
            }

            transactionRepository.save(Transaction.builder()
                    .booking(booking)
                    .user(user)
                    .amount(refundAmount)
                    .type(TransactionType.REFUND)
                    .note(txNote)
                    .build());

            booking.setDisputed(false);
            booking.setPaidOut(true); // Closed
            booking.setRefundAmount(refundAmount);
            
            // DISBURSE REMAINING TO GUIDE IMMEDIATELY
            BigDecimal remainingAmount = booking.getPaidAmount().subtract(refundAmount);
            if (remainingAmount.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal guideIncome = remainingAmount.multiply(BigDecimal.valueOf(0.8))
                        .setScale(0, RoundingMode.HALF_UP);
                
                User guide = booking.getTour().getGuide();
                guide.setBalance((guide.getBalance() != null ? guide.getBalance() : BigDecimal.ZERO).add(guideIncome));
                userRepository.save(guide);

                transactionRepository.save(Transaction.builder()
                        .booking(booking)
                        .user(guide)
                        .amount(guideIncome)
                        .type(TransactionType.INCOME)
                        .note("Thanh toán 80% số tiền còn lại sau khi bồi hoàn " + refundPercentage + "% cho khách: " + (booking.getBookingCode() != null ? booking.getBookingCode() : booking.getId()))
                        .build());

                // DISBURSE PLATFORM FEE (20%) TO ADMIN
                BigDecimal platformFee = remainingAmount.subtract(guideIncome);
                if (platformFee.compareTo(BigDecimal.ZERO) > 0) {
                    List<User> admins = userRepository.findAllByRoleName(RoleName.ADMIN);
                    if (!admins.isEmpty()) {
                        User admin = admins.get(0);
                        admin.setBalance((admin.getBalance() != null ? admin.getBalance() : BigDecimal.ZERO).add(platformFee));
                        userRepository.save(admin);

                        transactionRepository.save(Transaction.builder()
                                .booking(booking)
                                .user(admin)
                                .amount(platformFee)
                                .type(TransactionType.COMMISSION)
                                .note("Thu phí sàn (20% của phần còn lại) từ tour: " + (booking.getBookingCode() != null ? booking.getBookingCode() : booking.getTour().getTitle()))
                                .build());
                    }
                }
            }

            notificationService.sendNotification(user.getId(),
                    "Bồi hoàn thành công",
                    "Bạn đã được hoàn " + refundPercentage + "% (" + refundAmount + " VND) cho đơn hàng " + (booking.getBookingCode() != null ? booking.getBookingCode() : booking.getTour().getTitle()) + " theo phán quyết của Admin."
                        + (adminNote != null && !adminNote.isEmpty() ? " Lý do: " + adminNote : ""),
                    "DISPUTE_RESOLVED_REFUND");
                    
            notificationService.sendNotification(booking.getTour().getGuide().getId(),
                    "Kết quả phân xử khiếu nại",
                    "Khiếu nại đơn hàng " + (booking.getBookingCode() != null ? booking.getBookingCode() : booking.getTour().getTitle()) + " đã được chấp thuận. Hệ thống đã hoàn " + refundPercentage + "% cho khách hàng. Số tiền còn lại đã được cộng vào ví của bạn.",
                    "DISPUTE_RESOLVED_REFUND_GUIDE");
        }

        return mapToResponse(bookingRepository.save(booking));
    }
}
