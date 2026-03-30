package com.mtritran.travelplatform.service;

import com.mtritran.travelplatform.dto.request.BookingCreateRequest;
import com.mtritran.travelplatform.dto.response.BookingResponse;
import com.mtritran.travelplatform.entity.Booking;
import com.mtritran.travelplatform.entity.Location;
import com.mtritran.travelplatform.entity.Tour;
import com.mtritran.travelplatform.entity.User;
import com.mtritran.travelplatform.enums.BookingStatus;
import com.mtritran.travelplatform.exception.AppException;
import com.mtritran.travelplatform.exception.ErrorCode;
import com.mtritran.travelplatform.mapper.BookingMapper;
import com.mtritran.travelplatform.repository.BookingRepository;
import com.mtritran.travelplatform.repository.LocationRepository;
import com.mtritran.travelplatform.repository.TourRepository;
import com.mtritran.travelplatform.repository.UserRepository;
import com.mtritran.travelplatform.repository.ReviewRepository;
import com.mtritran.travelplatform.repository.TransactionRepository;
import com.mtritran.travelplatform.entity.Transaction;
import com.mtritran.travelplatform.enums.TransactionType;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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

    public BookingResponse getBookingById(String id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        // Check ownership: only user who booked OR the guide of the tour OR admin
        boolean isOwner = booking.getUser().getId().equals(currentUser.getId());
        boolean isGuide = booking.getTour().getGuide().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRoles().stream().anyMatch(r -> r.getName().equals("ADMIN"));

        if (!isOwner && !isGuide && !isAdmin) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        return mapToResponse(booking);
    }

    private BookingResponse mapToResponse(Booking booking) {
        BookingResponse response = bookingMapper.toResponse(booking);
        response.setReviewed(reviewRepository.existsByBookingId(booking.getId()));
        return response;
    }

    @Transactional
    public BookingResponse createBooking(BookingCreateRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        // Concurrency handling: lock the tour row
        Tour tour = tourRepository.findByIdWithLock(request.getTourId())
                .orElseThrow(() -> new AppException(ErrorCode.TOUR_NOT_FOUND));

        if (tour.getGuide().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.CANNOT_BOOK_OWN_TOUR);
        }

        // Capacity check: count confirmed AND active reservations (within 10 mins)
        if (tour.getMaxGuests() != null) {
            java.time.Instant expiryTime = java.time.Instant.now().minus(java.time.Duration.ofMinutes(10));
            Integer currentlyOccupied = bookingRepository.sumOccupiedSlots(tour.getId(), 
                request.getBookingDate(), tour.getStartTime(), expiryTime);
            if (currentlyOccupied == null) currentlyOccupied = 0;
            
            if (currentlyOccupied + request.getNumberOfGuests() > tour.getMaxGuests()) {
                throw new AppException(ErrorCode.EXCEED_MAX_GUESTS);
            }
        }

        BigDecimal pricePerGuest = tour.getPrice();
        BigDecimal total = pricePerGuest.multiply(BigDecimal.valueOf(request.getNumberOfGuests()));

        Location pickupLocation = null;
        if (request.getPickupLocationId() != null && !request.getPickupLocationId().isBlank()) {
            pickupLocation = locationRepository.findById(request.getPickupLocationId())
                    .orElseThrow(() -> new AppException(ErrorCode.LOCATION_NOT_FOUND));
        }

        BigDecimal depositPerc = tour.getDepositPercentage() != null ? tour.getDepositPercentage() : BigDecimal.valueOf(30);
        BigDecimal depositAmount = total.multiply(depositPerc).divide(BigDecimal.valueOf(100), 0, java.math.RoundingMode.HALF_UP);

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
            java.util.Map.of(
                "type", "NEW_BOOKING", 
                "message", "Bạn có một Booking mới cho tour: " + tour.getTitle(),
                "bookingId", savedBooking.getId()
            ));

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
            java.util.Map.of(
                "type", "BOOKING_STATUS_UPDATE", 
                "message", "Trạng thái đơn hàng " + booking.getTour().getTitle() + " đã chuyển sang " + status,
                "bookingId", saved.getId()
            ));

        return mapToResponse(saved);
    }

    @Transactional
    public BookingResponse cancelBooking(String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        
        // Check ownership (either the user who booked or the guide)
        boolean isGuide = booking.getTour().getGuide().getEmail().equals(email);
        boolean isCustomer = booking.getUser().getEmail().equals(email);

        if (!isGuide && !isCustomer) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.COMPLETED) {
            return mapToResponse(booking);
        }

        BigDecimal refund = BigDecimal.ZERO;
        if (isGuide) {
            // Guide cancels -> 100% refund of paid amount
            refund = booking.getPaidAmount();
        } else {
            // Customer cancels -> check time
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            java.time.LocalDateTime startDateTime = java.time.LocalDateTime.of(booking.getTour().getStartDate(), booking.getTour().getStartTime());
            
            if (now.isAfter(startDateTime)) {
                refund = BigDecimal.ZERO; // Already started/passed
            } else {
                long hoursDiff = java.time.Duration.between(now, startDateTime).toHours();
                if (hoursDiff > 48) {
                    refund = booking.getPaidAmount();
                } else if (hoursDiff > 24) {
                    refund = booking.getPaidAmount().multiply(new BigDecimal("0.5")).setScale(0, java.math.RoundingMode.HALF_UP);
                } else {
                    refund = BigDecimal.ZERO;
                }
            }
        }

        booking.setRefundAmount(refund);
        booking.setStatus(BookingStatus.CANCELLED);
        return mapToResponse(bookingRepository.save(booking));
    }

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
        booking.setStatus(BookingStatus.CONFIRMED);
        Booking saved = bookingRepository.save(booking);

        // Log Revenue Transaction
        transactionRepository.save(Transaction.builder()
                .booking(saved)
                .user(booking.getUser())
                .amount(booking.getDepositAmount())
                .type(TransactionType.REVENUE)
                .note("Thanh toán tiền cọc cho tour: " + booking.getTour().getTitle())
                .build());

        // Notify Guide real-time
        notificationService.sendNotification(booking.getTour().getGuide().getId(), 
            java.util.Map.of(
                "type", "PAYMENT_CONFIRMED", 
                "message", "Khách hàng đã thanh toán cọc cho tour: " + booking.getTour().getTitle(),
                "bookingId", saved.getId()
            ));
        
        return mapToResponse(saved);
    }

    /**
     * Gọi sau khi VNPAY trả về và chữ ký đã được xác thực — không dùng JWT vì phiên có thể hết hạn
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
        booking.setStatus(BookingStatus.CONFIRMED);
        Booking saved = bookingRepository.save(booking);
        transactionRepository.save(Transaction.builder()
                .booking(saved)
                .user(booking.getUser())
                .amount(booking.getDepositAmount())
                .type(TransactionType.REVENUE)
                .note("Thanh toán tiền cọc cho tour: " + booking.getTour().getTitle())
                .build());
        notificationService.sendNotification(booking.getTour().getGuide().getId(),
                java.util.Map.of(
                        "type", "PAYMENT_CONFIRMED",
                        "message", "Khách hàng đã thanh toán cọc cho tour: " + booking.getTour().getTitle(),
                        "bookingId", saved.getId()));
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
        transactionRepository.save(Transaction.builder()
                .booking(saved)
                .user(booking.getUser())
                .amount(payAmount)
                .type(TransactionType.REVENUE)
                .note("Thanh toán nốt số tiền còn lại cho tour: " + booking.getTour().getTitle())
                .build());
        notificationService.sendNotification(booking.getTour().getGuide().getId(),
                java.util.Map.of(
                        "type", "PAYMENT_COMPLETED",
                        "message", "Khách hàng đã thanh toán đủ 100% cho tour: " + booking.getTour().getTitle(),
                        "bookingId", saved.getId()));
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

        // Log Revenue Transaction (Remaining)
        transactionRepository.save(Transaction.builder()
                .booking(saved)
                .user(booking.getUser())
                .amount(payAmount)
                .type(TransactionType.REVENUE)
                .note("Thanh toán nốt số tiền còn lại cho tour: " + booking.getTour().getTitle())
                .build());

        // Notify Guide real-time
        notificationService.sendNotification(booking.getTour().getGuide().getId(), 
            java.util.Map.of(
                "type", "PAYMENT_COMPLETED", 
                "message", "Khách hàng đã thanh toán đủ 100% cho tour: " + booking.getTour().getTitle(),
                "bookingId", saved.getId()
            ));
        
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

        // Logic check: only allow completion after the tour has started
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        java.time.LocalDateTime tourStart = java.time.LocalDateTime.of(booking.getBookingDate(), booking.getStartTime());
        if (now.isBefore(tourStart)) {
            throw new AppException(ErrorCode.TOUR_NOT_STARTED_YET);
        }

        booking.setStatus(BookingStatus.COMPLETED);
        Booking saved = bookingRepository.save(booking);

        // 20% commission logic
        java.math.BigDecimal total = booking.getTotalPrice();
        java.math.BigDecimal platformFee = total.multiply(new java.math.BigDecimal("0.20"));
        java.math.BigDecimal guideEarnings = total.subtract(platformFee);

        User guide = booking.getTour().getGuide();
        guide.setBalance(guide.getBalance().add(guideEarnings));
        userRepository.save(guide);

        // Log Internal Transactions
        // 1. Log Commission (Admin Profit)
        transactionRepository.save(Transaction.builder()
                .booking(saved)
                .amount(platformFee)
                .type(TransactionType.COMMISSION)
                .note("Phí dịch vụ sàn (20%) từ tour: " + booking.getTour().getTitle())
                .build());

        // 2. Log Guide Income (Wallet credit)
        transactionRepository.save(Transaction.builder()
                .booking(saved)
                .user(guide)
                .amount(guideEarnings)
                .type(TransactionType.INCOME)
                .note("Tiền thực nhận từ tour: " + booking.getTour().getTitle() + " (sau khi trừ phí 20%)")
                .build());

        // Notify Customer real-time
        notificationService.sendNotification(booking.getUser().getId(), 
            java.util.Map.of(
                "type", "TOUR_COMPLETED", 
                "message", "Tour " + booking.getTour().getTitle() + " đã hoàn thành. Cảm ơn bạn!",
                "bookingId", saved.getId()
            ));
        
        return mapToResponse(saved);
    }
}
