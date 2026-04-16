package com.mtritran.travelplatform.service;

import com.mtritran.travelplatform.dto.request.TourRequestCreateRequest;
import com.mtritran.travelplatform.dto.response.TourRequestInterestResponse;
import com.mtritran.travelplatform.dto.response.TourRequestResponse;
import com.mtritran.travelplatform.entity.Location;
import com.mtritran.travelplatform.entity.TourRequest;
import com.mtritran.travelplatform.entity.TourRequestInterest;
import com.mtritran.travelplatform.entity.Transaction;
import com.mtritran.travelplatform.entity.User;
import com.mtritran.travelplatform.enums.RoleName;
import com.mtritran.travelplatform.enums.TourRequestPaymentStatus;
import com.mtritran.travelplatform.enums.TourRequestStatus;
import com.mtritran.travelplatform.enums.TransactionType;
import com.mtritran.travelplatform.exception.AppException;
import com.mtritran.travelplatform.exception.ErrorCode;
import com.mtritran.travelplatform.mapper.TourRequestMapper;
import com.mtritran.travelplatform.repository.LocationRepository;
import com.mtritran.travelplatform.repository.TourRequestInterestRepository;
import com.mtritran.travelplatform.repository.TourRequestRepository;
import com.mtritran.travelplatform.repository.TransactionRepository;
import com.mtritran.travelplatform.repository.UserRepository;
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
import java.util.Map;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TourRequestService {
        TourRequestRepository tourRequestRepository;
        TourRequestInterestRepository tourRequestInterestRepository;
        UserRepository userRepository;
        LocationRepository locationRepository;
        TourRequestMapper tourRequestMapper;
        NotificationService notificationService;
        TransactionRepository transactionRepository;
        PenaltyService penaltyService;
        StorageService storageService;

        public TourRequestResponse createRequest(TourRequestCreateRequest request) {
                String email = SecurityContextHolder.getContext().getAuthentication().getName();
                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

                Location location = null;
                if (request.getLocationId() != null) {
                        location = locationRepository.findById(request.getLocationId())
                                        .orElseThrow(() -> new AppException(ErrorCode.LOCATION_NOT_FOUND));
                }

                int expiryHrs = request.getExpiryHours() != null ? request.getExpiryHours() : 24;

                TourRequest tourRequest = TourRequest.builder()
                                .user(user)
                                .location(location)
                                .customLocationName(request.getCustomLocationName())
                                .latitude(request.getLatitude())
                                .longitude(request.getLongitude())
                                .plannedDate(request.getPlannedDate())
                                .title(request.getTitle())
                                .budget(request.getBudget())
                                .numberOfGuests(request.getNumberOfGuests() != null ? request.getNumberOfGuests() : 1)
                                .description(request.getDescription())
                                .status(TourRequestStatus.OPEN)
                                .expiresAt(Instant.now().plus(expiryHrs, ChronoUnit.HOURS))
                                .meetingLocationName(request.getMeetingLocationName())
                                .meetingLatitude(request.getMeetingLatitude())
                                .meetingLongitude(request.getMeetingLongitude())
                                .startTime(request.getStartTime())
                                .endTime(request.getEndTime())
                                .depositPercentage(
                                                request.getDepositPercentage() != null ? request.getDepositPercentage()
                                                                : BigDecimal.valueOf(30))
                                .paymentStatus(TourRequestPaymentStatus.PENDING)
                                .build();

                TourRequest saved = tourRequestRepository.save(tourRequest);

                // Broadcast to all guides about new request
                notificationService.broadcastNotification("requests",
                                Map.of(
                                                "type", "NEW_TOUR_REQUEST",
                                                "message", "Có một yêu cầu tour mới: " + tourRequest.getTitle()));

                return mapToResponse(saved);
        }

        private TourRequestResponse mapToResponse(TourRequest tourRequest) {
                TourRequestResponse response = tourRequestMapper.toResponse(tourRequest);

                // Populate customer info
                response.setCustomerName(tourRequest.getUser().getFullName());
                response.setCustomerEmail(tourRequest.getUser().getEmail());
                response.setCustomerPhone(tourRequest.getUser().getPhone());

                // Populate guide info if matched or pending
                if (tourRequest.getGuide() != null) {
                        response.setGuideName(tourRequest.getGuide().getFullName());
                        response.setGuideAvatarUrl(tourRequest.getGuide().getAvatarUrl());
                        response.setGuideEmail(tourRequest.getGuide().getEmail());
                        response.setGuidePhone(tourRequest.getGuide().getPhone());
                }

                // Expanded fields
                response.setMeetingLocationName(tourRequest.getMeetingLocationName());
                response.setMeetingLatitude(tourRequest.getMeetingLatitude());
                response.setMeetingLongitude(tourRequest.getMeetingLongitude());
                response.setStartTime(tourRequest.getStartTime());
                response.setEndTime(tourRequest.getEndTime());
                response.setDepositPercentage(tourRequest.getDepositPercentage());
                response.setDepositAmount(tourRequest.getDepositAmount());
                response.setPaidAmount(tourRequest.getPaidAmount());
                response.setPaymentStatus(tourRequest.getPaymentStatus());

                // Check for expiry status override
                if (TourRequestStatus.OPEN.equals(tourRequest.getStatus()) &&
                                tourRequest.getExpiresAt() != null &&
                                tourRequest.getExpiresAt().isBefore(Instant.now())) {
                        response.setStatus(TourRequestStatus.EXPIRED);
                }

                // Populate interest list
                List<TourRequestInterest> interests = tourRequestInterestRepository
                                .findByTourRequestIdOrderByCreatedAtAsc(tourRequest.getId());

                response.setInterestedGuides(interests.stream().map(interest -> TourRequestInterestResponse.builder()
                                .id(interest.getId())
                                .guideId(interest.getGuide().getId())
                                .guideName(interest.getGuide().getFullName())
                                .guideAvatarUrl(interest.getGuide().getAvatarUrl())
                                .guideEmail(interest.getGuide().getEmail())
                                .guidePhone(interest.getGuide().getPhone())
                                .message(interest.getMessage())
                                .createdAt(interest.getCreatedAt())
                                .build()).toList());

                return response;
        }

        public List<TourRequestResponse> getAllOpenRequests() {
                return tourRequestRepository.findAllByStatusOrderByCreatedAtDesc(TourRequestStatus.OPEN).stream()
                                .filter(req -> req.getExpiresAt() == null || req.getExpiresAt().isAfter(Instant.now()))
                                .map(this::mapToResponse)
                                .toList();
        }

        public List<TourRequestResponse> getMyRequests() {
                String email = SecurityContextHolder.getContext().getAuthentication().getName();
                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));
                return tourRequestRepository.findAllByUserOrderByCreatedAtDesc(user).stream()
                                .map(this::mapToResponse)
                                .toList();
        }

        public List<TourRequestResponse> getAcceptedRequests() {
                String email = SecurityContextHolder.getContext().getAuthentication().getName();
                User guide = userRepository.findByEmail(email)
                                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));
                return tourRequestRepository.findAllByGuideOrderByCreatedAtDesc(guide).stream()
                                .map(this::mapToResponse)
                                .toList();
        }

        public List<TourRequestResponse> getNearbyRequests(double lat, double lng, double radius) {
                return tourRequestRepository.findNearbyRequests(lat, lng, radius).stream()
                                .filter(req -> req.getExpiresAt() == null || req.getExpiresAt().isAfter(Instant.now()))
                                .map(this::mapToResponse)
                                .toList();
        }

        @Transactional
        public TourRequestResponse addInterest(String requestId, String message) {
                String email = SecurityContextHolder.getContext().getAuthentication().getName();
                User guide = userRepository.findByEmail(email)
                                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

                TourRequest tourRequest = tourRequestRepository.findById(requestId)
                                .orElseThrow(() -> new AppException(ErrorCode.TOUR_REQUEST_NOT_FOUND));

                if (tourRequest.getUser().getId().equals(guide.getId())) {
                        throw new AppException(ErrorCode.CANNOT_ACCEPT_OWN_REQUEST);
                }

                // Penalty Check: Block banned guides
                if (guide.getGuideBannedUntil() != null && guide.getGuideBannedUntil().isAfter(Instant.now())) {
                        throw new AppException(ErrorCode.UNAUTHORIZED); // Or customize error: GUIDE_BANNED
                }

                if (tourRequest.getStatus() != TourRequestStatus.OPEN) {
                        throw new AppException(ErrorCode.INVALID_BOOKING_STATUS);
                }

                if (tourRequestInterestRepository.existsByTourRequestIdAndGuideId(requestId, guide.getId())) {
                        throw new AppException(ErrorCode.ALREADY_EXPRESSED_INTEREST); // Already interested
                }

                TourRequestInterest interest = TourRequestInterest.builder()
                                .tourRequest(tourRequest)
                                .guide(guide)
                                .message(message)
                                .build();

                tourRequestInterestRepository.save(interest);

                // Notify Customer
                notificationService.sendNotification(tourRequest.getUser().getId(),
                                "Quan tâm mới",
                                "HDV " + guide.getFullName() + " quan tâm đến chuyến đi của bạn: "
                                                + tourRequest.getTitle(),
                                "NEW_GUIDE_INTEREST");

                return mapToResponse(tourRequest);
        }

        @Transactional
        public TourRequestResponse selectGuide(String requestId, String guideId) {
                String email = SecurityContextHolder.getContext().getAuthentication().getName();
                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

                TourRequest tourRequest = tourRequestRepository.findById(requestId)
                                .orElseThrow(() -> new AppException(ErrorCode.TOUR_REQUEST_NOT_FOUND));

                if (!tourRequest.getUser().getId().equals(user.getId())) {
                        throw new AppException(ErrorCode.UNAUTHORIZED);
                }

                User guide = userRepository.findById(guideId)
                                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

                tourRequest.setStatus(TourRequestStatus.PENDING_CONFIRMATION);
                tourRequest.setGuide(guide);
                TourRequest saved = tourRequestRepository.save(tourRequest);

                // Notify Guide real-time
                notificationService.sendNotification(guideId,
                                "Bạn được chọn",
                                "Bạn đã được chọn cho yêu cầu: " + tourRequest.getTitle()
                                                + ". Hãy xác nhận hoặc từ chối nhé!",
                                "TOUR_REQUEST_SELECTED");

                return mapToResponse(saved);
        }

        @Transactional
        public TourRequestResponse confirmMatch(String requestId) {
                String email = SecurityContextHolder.getContext().getAuthentication().getName();
                User guide = userRepository.findByEmail(email)
                                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

                TourRequest tourRequest = tourRequestRepository.findById(requestId)
                                .orElseThrow(() -> new AppException(ErrorCode.TOUR_REQUEST_NOT_FOUND));

                if (tourRequest.getGuide() == null || !tourRequest.getGuide().getId().equals(guide.getId())) {
                        throw new AppException(ErrorCode.UNAUTHORIZED);
                }

                if (tourRequest.getStatus() != TourRequestStatus.PENDING_CONFIRMATION) {
                        throw new AppException(ErrorCode.INVALID_BOOKING_STATUS);
                }

                tourRequest.setStatus(TourRequestStatus.WAITING_PAYMENT);

                // Calculate deposit amount
                if (tourRequest.getBudget() != null) {
                        BigDecimal total = tourRequest.getBudget();
                        BigDecimal depositPercent = tourRequest.getDepositPercentage() != null
                                        ? tourRequest.getDepositPercentage()
                                        : BigDecimal.valueOf(30);
                        BigDecimal depositAmount = total.multiply(depositPercent).divide(BigDecimal.valueOf(100));
                        tourRequest.setDepositAmount(depositAmount);
                }

                TourRequest saved = tourRequestRepository.save(tourRequest);

                // Notify Customer
                notificationService.sendNotification(tourRequest.getUser().getId(),
                                "HDV đã xác nhận",
                                "HDV " + guide.getFullName() + " đã xác nhận và đang chờ bạn thanh toán cho: "
                                                + tourRequest.getTitle(),
                                "TOUR_REQUEST_MATCHED");

                return mapToResponse(saved);
        }

        @Transactional
        public TourRequestResponse declineMatch(String requestId) {
                String email = SecurityContextHolder.getContext().getAuthentication().getName();
                User guide = userRepository.findByEmail(email)
                                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

                TourRequest tourRequest = tourRequestRepository.findById(requestId)
                                .orElseThrow(() -> new AppException(ErrorCode.TOUR_REQUEST_NOT_FOUND));

                if (tourRequest.getGuide() == null || !tourRequest.getGuide().getId().equals(guide.getId())) {
                        throw new AppException(ErrorCode.UNAUTHORIZED);
                }

                // Remove this guide from interests if they decline
                tourRequestInterestRepository.findByTourRequestIdAndGuideId(requestId, guide.getId())
                                .ifPresent(tourRequestInterestRepository::delete);

                // Refund if necessary
                if (tourRequest.getPaidAmount() != null && tourRequest.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
                        User customer = tourRequest.getUser();
                        BigDecimal currentBalance = customer.getBalance() != null ? customer.getBalance()
                                        : BigDecimal.ZERO;
                        customer.setBalance(currentBalance.add(tourRequest.getPaidAmount()));
                        userRepository.save(customer);

                        // Notify Customer about refund
                        notificationService.sendNotification(customer.getId(),
                                        "Hoàn tiền yêu cầu",
                                        "Bạn đã nhận được hoàn tiền " + tourRequest.getPaidAmount()
                                                        + " VND từ yêu cầu bị từ chối: " + tourRequest.getTitle(),
                                        "REFUND_PROCESSED");
                }

                tourRequest.setStatus(TourRequestStatus.OPEN);
                tourRequest.setGuide(null);
                tourRequest.setPaidAmount(BigDecimal.ZERO);
                tourRequest.setPaymentStatus(TourRequestPaymentStatus.PENDING);

                TourRequest saved = tourRequestRepository.save(tourRequest);

                // Notify Customer about decline
                notificationService.sendNotification(tourRequest.getUser().getId(),
                                "Yêu cầu bị từ chối",
                                "Tiếc quá, HDV " + guide.getFullName()
                                                + " hiện đang bận nên đã từ chối yêu cầu của bạn. Hệ thống đã mở lại tour và hoàn tiền (nếu có).",
                                "TOUR_REQUEST_DECLINED");

                return mapToResponse(saved);
        }

        @Transactional
        public TourRequestResponse cancelMatch(String requestId) {
                String email = SecurityContextHolder.getContext().getAuthentication().getName();
                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

                TourRequest tourRequest = tourRequestRepository.findById(requestId)
                                .orElseThrow(() -> new AppException(ErrorCode.TOUR_REQUEST_NOT_FOUND));

                if (!tourRequest.getUser().getId().equals(user.getId())) {
                        throw new AppException(ErrorCode.UNAUTHORIZED);
                }

                // Refund Logic with 80/20 rule if cancelled < 24h before tour
                if (tourRequest.getPaidAmount() != null && tourRequest.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
                        LocalDateTime tourStart = LocalDateTime.of(tourRequest.getPlannedDate(),
                                        tourRequest.getStartTime() != null ? tourRequest.getStartTime()
                                                        : LocalTime.of(0, 0));
                        LocalDateTime now = LocalDateTime.now();

                        BigDecimal refundAmount;
                        BigDecimal platformFee = BigDecimal.ZERO;

                        Duration timeUntilTour = Duration.between(now, tourStart);
                        long hoursLeft = timeUntilTour.toHours();

                        if (hoursLeft >= 48) {
                                // Early cancellation (> 48h): 100% refund
                                refundAmount = tourRequest.getPaidAmount();
                        } else if (hoursLeft >= 24) {
                                // Mid cancellation (24-48h): 50% refund, 50% penalty
                                platformFee = tourRequest.getPaidAmount().multiply(new BigDecimal("0.50"))
                                                .setScale(0, RoundingMode.HALF_UP);
                                refundAmount = tourRequest.getPaidAmount().subtract(platformFee);

                                user.setCancellationCount(
                                                (user.getCancellationCount() != null ? user.getCancellationCount() : 0)
                                                                + 1);
                                tourRequest.setPayoutAt(Instant.now().plus(24, ChronoUnit.HOURS));
                        } else {
                                // Late cancellation (< 24h): 0% refund, hold 24h for dispute window
                                platformFee = tourRequest.getPaidAmount();
                                refundAmount = BigDecimal.ZERO;

                                user.setCancellationCount(
                                                (user.getCancellationCount() != null ? user.getCancellationCount() : 0)
                                                                + 1);
                                tourRequest.setPayoutAt(Instant.now().plus(24, ChronoUnit.HOURS));
                        }

                        BigDecimal currentBalance = user.getBalance() != null ? user.getBalance() : BigDecimal.ZERO;
                        user.setBalance(currentBalance.add(refundAmount));
                        userRepository.save(user);

                        notificationService.sendNotification(user.getId(),
                                        "Cập nhật hoàn tiền",
                                        "Bạn được hoàn " + refundAmount + " VND sau khi hủy yêu cầu (Phí hủy: "
                                                        + platformFee + " VND)",
                                        "REFUND_PROCESSED");

                        tourRequest.setPaidAmount(platformFee); // Keep only what goes to platform in escrow
                        tourRequest.setRefundAmount(refundAmount);
                }

                tourRequest.setStatus(TourRequestStatus.OPEN); // Or CANCELLED? User wants OPEN potentially to
                                                               // re-request
                tourRequest.setGuide(null);
                tourRequest.setPaymentStatus(TourRequestPaymentStatus.CANCELLED);

                TourRequest saved = tourRequestRepository.save(tourRequest);

                return mapToResponse(saved);
        }

        @Transactional
        public TourRequestResponse updateRequest(String id, TourRequestCreateRequest request) {
                String email = SecurityContextHolder.getContext().getAuthentication().getName();
                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

                TourRequest tourRequest = tourRequestRepository.findById(id)
                                .orElseThrow(() -> new AppException(ErrorCode.TOUR_REQUEST_NOT_FOUND));

                if (!tourRequest.getUser().getId().equals(user.getId())) {
                        throw new AppException(ErrorCode.UNAUTHORIZED);
                }

                if (tourRequest.getStatus() != TourRequestStatus.OPEN) {
                        throw new AppException(ErrorCode.INVALID_BOOKING_STATUS);
                }

                Location location = null;
                if (request.getLocationId() != null) {
                        location = locationRepository.findById(request.getLocationId())
                                        .orElseThrow(() -> new AppException(ErrorCode.LOCATION_NOT_FOUND));
                }

                tourRequest.setTitle(request.getTitle());
                tourRequest.setDescription(request.getDescription());
                tourRequest.setPlannedDate(request.getPlannedDate());
                tourRequest.setBudget(request.getBudget());
                tourRequest.setNumberOfGuests(request.getNumberOfGuests() != null ? request.getNumberOfGuests() : 1);
                tourRequest.setLocation(location);
                tourRequest.setCustomLocationName(request.getCustomLocationName());
                tourRequest.setLatitude(request.getLatitude());
                tourRequest.setLongitude(request.getLongitude());

                // New fields
                tourRequest.setMeetingLocationName(request.getMeetingLocationName());
                tourRequest.setMeetingLatitude(request.getMeetingLatitude());
                tourRequest.setMeetingLongitude(request.getMeetingLongitude());
                tourRequest.setStartTime(request.getStartTime());
                tourRequest.setEndTime(request.getEndTime());
                if (request.getDepositPercentage() != null) {
                        tourRequest.setDepositPercentage(request.getDepositPercentage());
                }

                if (request.getExpiryHours() != null) {
                        tourRequest.setExpiresAt(Instant.now().plus(request.getExpiryHours(), ChronoUnit.HOURS));
                }

                return mapToResponse(tourRequestRepository.save(tourRequest));
        }

        @Transactional
        public TourRequestResponse payDeposit(String requestId) {
                String email = SecurityContextHolder.getContext().getAuthentication().getName();
                User customer = userRepository.findByEmail(email)
                                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

                TourRequest tourRequest = tourRequestRepository.findById(requestId)
                                .orElseThrow(() -> new AppException(ErrorCode.TOUR_REQUEST_NOT_FOUND));

                if (!tourRequest.getUser().getId().equals(customer.getId())) {
                        throw new AppException(ErrorCode.UNAUTHORIZED);
                }

                if (tourRequest.getStatus() != TourRequestStatus.WAITING_PAYMENT) {
                        throw new AppException(ErrorCode.INVALID_BOOKING_STATUS);
                }

                BigDecimal deposit = tourRequest.getDepositAmount() != null ? tourRequest.getDepositAmount()
                                : BigDecimal.ZERO;
                BigDecimal currentBalance = customer.getBalance() != null ? customer.getBalance() : BigDecimal.ZERO;

                if (currentBalance.compareTo(deposit) < 0) {
                        throw new AppException(ErrorCode.INSUFFICIENT_BALANCE);
                }

                // Deduct balance
                customer.setBalance(currentBalance.subtract(deposit));
                userRepository.save(customer);

                tourRequest.setPaidAmount(deposit);
                tourRequest.setPaymentStatus(TourRequestPaymentStatus.PAID_DEPOSIT);
                tourRequest.setStatus(TourRequestStatus.CONFIRMED);

                // Set Payout time: Tour end time + 24 hours (Dispute window)
                // Since TourRequestplannedDate is used as date and startTime as time
                LocalDateTime endDateTime = LocalDateTime.of(tourRequest.getPlannedDate(),
                                tourRequest.getEndTime() != null ? tourRequest.getEndTime() : LocalTime.of(23, 59));
                tourRequest.setPayoutAt(endDateTime.atZone(ZoneId.systemDefault()).toInstant()
                                .plus(24, ChronoUnit.HOURS));

                TourRequest saved = tourRequestRepository.save(tourRequest);

                // Notify Guide
                notificationService.sendNotification(tourRequest.getGuide().getId(),
                                "Khách đã đặt cọc",
                                "Khách hàng " + customer.getFullName() + " đã thanh toán cọc cho yêu cầu: "
                                                + tourRequest.getTitle(),
                                "TOUR_REQUEST_PAID");

                return mapToResponse(saved);
        }

        @Transactional
        public TourRequestResponse payRemaining(String requestId) {
                String email = SecurityContextHolder.getContext().getAuthentication().getName();
                User customer = userRepository.findByEmail(email)
                                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

                TourRequest tourRequest = tourRequestRepository.findById(requestId)
                                .orElseThrow(() -> new AppException(ErrorCode.TOUR_REQUEST_NOT_FOUND));

                if (!tourRequest.getUser().getId().equals(customer.getId())) {
                        throw new AppException(ErrorCode.UNAUTHORIZED);
                }

                if (tourRequest.getStatus() != TourRequestStatus.CONFIRMED
                                || tourRequest.getPaymentStatus() != TourRequestPaymentStatus.PAID_DEPOSIT) {
                        throw new AppException(ErrorCode.INVALID_BOOKING_STATUS);
                }

                BigDecimal budget = tourRequest.getBudget() != null ? tourRequest.getBudget() : BigDecimal.ZERO;
                BigDecimal paid = tourRequest.getPaidAmount() != null ? tourRequest.getPaidAmount() : BigDecimal.ZERO;
                BigDecimal remaining = budget.subtract(paid);

                BigDecimal currentBalance = customer.getBalance() != null ? customer.getBalance() : BigDecimal.ZERO;

                if (currentBalance.compareTo(remaining) < 0) {
                        throw new AppException(ErrorCode.INSUFFICIENT_BALANCE);
                }

                customer.setBalance(currentBalance.subtract(remaining));
                userRepository.save(customer);

                tourRequest.setPaidAmount(budget);
                tourRequest.setPaymentStatus(TourRequestPaymentStatus.PAID_FULL);

                return mapToResponse(tourRequestRepository.save(tourRequest));
        }

        @Transactional
        public void applyVnpayDepositSuccess(String requestId) {
                TourRequest tourReq = tourRequestRepository.findById(requestId)
                                .orElseThrow(() -> new AppException(ErrorCode.TOUR_REQUEST_NOT_FOUND));

                BigDecimal deposit = tourReq.getDepositAmount() != null ? tourReq.getDepositAmount() : BigDecimal.ZERO;
                tourReq.setPaidAmount(deposit);
                tourReq.setPaymentStatus(TourRequestPaymentStatus.PAID_DEPOSIT);
                tourReq.setStatus(TourRequestStatus.CONFIRMED);

                // Set Payout time
                LocalDateTime endDateTime = LocalDateTime.of(tourReq.getPlannedDate(),
                                tourReq.getEndTime() != null ? tourReq.getEndTime() : LocalTime.of(23, 59));
                tourReq.setPayoutAt(endDateTime.atZone(ZoneId.systemDefault()).toInstant()
                                .plus(24, ChronoUnit.HOURS));

                TourRequest saved = tourRequestRepository.save(tourReq);

                // Log REVENUE to Admin (Platform intermediary)
                User admin = userRepository.findAllByRoleName(RoleName.ADMIN).get(0);
                transactionRepository.save(Transaction.builder()
                                .tourRequest(saved)
                                .user(admin)
                                .amount(deposit)
                                .type(TransactionType.REVENUE)
                                .note("Thanh toán tiền cọc cho yêu cầu: " + tourReq.getTitle())
                                .build());

                // Notify Guide
                if (tourReq.getGuide() != null) {
                        notificationService.sendNotification(tourReq.getGuide().getId(),
                                        "Khách đã đặt cọc",
                                        "Khách hàng " + tourReq.getUser().getFullName()
                                                        + " đã thanh toán cọc cho yêu cầu: " + tourReq.getTitle(),
                                        "TOUR_REQUEST_PAID");
                }
        }

        @Transactional
        public void applyVnpayRemainingSuccess(String requestId) {
                TourRequest tourReq = tourRequestRepository.findById(requestId)
                                .orElseThrow(() -> new AppException(ErrorCode.TOUR_REQUEST_NOT_FOUND));

                BigDecimal budget = tourReq.getBudget() != null ? tourReq.getBudget() : BigDecimal.ZERO;
                BigDecimal paidBefore = tourReq.getPaidAmount() != null ? tourReq.getPaidAmount() : BigDecimal.ZERO;
                BigDecimal payAmount = budget.subtract(paidBefore);

                tourReq.setPaidAmount(budget);
                tourReq.setPaymentStatus(TourRequestPaymentStatus.PAID_FULL);
                TourRequest saved = tourRequestRepository.save(tourReq);

                // Log REVENUE to Admin (Platform intermediary)
                User admin = userRepository.findAllByRoleName(RoleName.ADMIN).get(0);
                transactionRepository.save(Transaction.builder()
                                .tourRequest(saved)
                                .user(admin)
                                .amount(payAmount)
                                .type(TransactionType.REVENUE)
                                .note("Thanh toán nốt số tiền còn lại cho yêu cầu: " + tourReq.getTitle())
                                .build());
        }

        @Transactional
        public TourRequestResponse completeTour(String requestId) {
                String email = SecurityContextHolder.getContext().getAuthentication().getName();
                User guide = userRepository.findByEmail(email)
                                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

                TourRequest tourRequest = tourRequestRepository.findById(requestId)
                                .orElseThrow(() -> new AppException(ErrorCode.TOUR_REQUEST_NOT_FOUND));

                if (tourRequest.getGuide() == null || !tourRequest.getGuide().getId().equals(guide.getId())) {
                        throw new AppException(ErrorCode.UNAUTHORIZED);
                }

                if (tourRequest.getStatus() != TourRequestStatus.CONFIRMED
                                || tourRequest.getPaymentStatus() != TourRequestPaymentStatus.PAID_FULL) {
                        throw new AppException(ErrorCode.INVALID_BOOKING_STATUS);
                }

                // Logic check: only allow completion after the tour has started
                LocalDateTime now = LocalDateTime.now();
                LocalDateTime tourStart = LocalDateTime.of(tourRequest.getPlannedDate(), tourRequest.getStartTime());
                // if (now.isBefore(tourStart)) {
                // throw new AppException(ErrorCode.TOUR_NOT_STARTED_YET);
                // }

                tourRequest.setStatus(TourRequestStatus.COMPLETED);

                // Set payoutAt to 24h from now (dispute window)
                tourRequest.setPayoutAt(Instant.now().plus(24, ChronoUnit.HOURS));

                TourRequest saved = tourRequestRepository.save(tourRequest);

                return mapToResponse(saved);
        }

        @Transactional
        public void deleteRequest(String id) {
                String email = SecurityContextHolder.getContext().getAuthentication().getName();
                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

                TourRequest tourRequest = tourRequestRepository.findById(id)
                                .orElseThrow(() -> new AppException(ErrorCode.TOUR_REQUEST_NOT_FOUND));

                if (!tourRequest.getUser().getId().equals(user.getId())) {
                        throw new AppException(ErrorCode.UNAUTHORIZED);
                }

                // Status check: Only allow deleting if OPEN or EXPIRED
                boolean isOpen = TourRequestStatus.OPEN.equals(tourRequest.getStatus());
                boolean isExpired = tourRequest.getExpiresAt() != null
                                && tourRequest.getExpiresAt().isBefore(Instant.now());

                if (!isOpen && !isExpired) {
                        throw new AppException(ErrorCode.INVALID_BOOKING_STATUS);
                }

                // Delete interests first (cascading or manual)
                tourRequestInterestRepository.findByTourRequestIdOrderByCreatedAtAsc(id)
                                .forEach(tourRequestInterestRepository::delete);

                tourRequestRepository.delete(tourRequest);
        }

        public TourRequestResponse acceptRequest(String requestId) {
                // Obsolete
                return null;
        }

        @Transactional
        public TourRequestResponse fileDispute(String requestId, String reason, List<MultipartFile> files) {
                TourRequest tourRequest = tourRequestRepository.findById(requestId)
                                .orElseThrow(() -> new AppException(ErrorCode.TOUR_REQUEST_NOT_FOUND));

                String email = SecurityContextHolder.getContext().getAuthentication().getName();
                if (!tourRequest.getUser().getEmail().equals(email)) {
                        throw new AppException(ErrorCode.UNAUTHORIZED);
                }

                if (tourRequest.getStatus() != TourRequestStatus.COMPLETED
                                && tourRequest.getPaymentStatus() != TourRequestPaymentStatus.PAID_FULL) {
                        throw new AppException(ErrorCode.INVALID_BOOKING_STATUS);
                }

                if (tourRequest.isDisputed()) {
                        throw new AppException(ErrorCode.ALREADY_DISPUTED);
                }

                // Verify timing: must be before payoutAt
                if (Instant.now().isAfter(tourRequest.getPayoutAt())) {
                        throw new AppException(ErrorCode.DISPUTE_WINDOW_EXPIRED);
                }

                tourRequest.setDisputed(true);
                tourRequest.setDisputeReason(reason);

                // Similar evidence handling as BookingService
                if (files != null && !files.isEmpty()) {
                        List<String> paths = new ArrayList<>();
                        for (MultipartFile file : files) {
                                if (file != null && !file.isEmpty()) {
                                        String evidencePath = storageService.saveFile(file,
                                                        "disputes/req_" + tourRequest.getId());
                                        paths.add(evidencePath);
                                }
                        }
                        if (!paths.isEmpty()) {
                                tourRequest.setDisputeEvidenceUrl(String.join(";", paths));
                        }
                }

                tourRequest.setDisputedAt(Instant.now());

                notificationService.sendNotification(tourRequest.getGuide().getId(),
                                "Khiếu nại mới từ khách hàng",
                                "Yêu cầu " + tourRequest.getRequestCode()
                                                + " bị khiếu nại. Thanh toán đang bị tạm dừng để Admin kiểm tra.",
                                "TOUR_REQUEST_DISPUTED");

                // Notify Admins
                List<User> admins = userRepository.findAllByRoleName(RoleName.ADMIN);
                for (User admin : admins) {
                        notificationService.sendNotification(admin.getId(),
                                        "Khiếu nại mới cần xử lý (Custom)",
                                        "Khách hàng đã gửi khiếu nại cho yêu cầu: " + tourRequest.getTitle(),
                                        "NEW_DISPUTE");
                }

                return mapToResponse(tourRequestRepository.save(tourRequest));
        }

        public List<TourRequestResponse> getDisputedTourRequests() {
                return tourRequestRepository.findAllByIsDisputedTrue().stream()
                                .map(this::mapToResponse)
                                .toList();
        }

        @Transactional
        public TourRequestResponse resolveDispute(String id, String action, int refundPercentage, String adminNote) {
                TourRequest tourRequest = tourRequestRepository.findById(id)
                                .orElseThrow(() -> new AppException(ErrorCode.TOUR_REQUEST_NOT_FOUND));

                if (!tourRequest.isDisputed()) {
                        throw new AppException(ErrorCode.INVALID_KEY);
                }

                if ("RELEASE".equalsIgnoreCase(action)) {
                        // Admin favors Guide: Un-freeze
                        tourRequest.setDisputed(false);

                        notificationService.sendNotification(tourRequest.getUser().getId(),
                                        "Phán quyết khiếu nại (Custom)",
                                        "Khiếu nại yêu cầu " + tourRequest.getRequestCode()
                                                        + " của bạn đã được Admin bác bỏ."
                                                        + (adminNote != null && !adminNote.isEmpty()
                                                                        ? " Ghi chú: " + adminNote
                                                                        : ""),
                                        "DISPUTE_REJECTED");

                        notificationService.sendNotification(tourRequest.getGuide().getId(),
                                        "Khiếu nại đã được bác bỏ (Custom)",
                                        "Chúc mừng! Khiếu nại yêu cầu " + tourRequest.getRequestCode()
                                                        + " đã được Admin bác bỏ. Bạn sẽ nhận được thanh toán sớm.",
                                        "DISPUTE_RESOLVED_RELEASE");
                } else if ("REFUND".equalsIgnoreCase(action)) {
                        if (refundPercentage < 1 || refundPercentage > 100) {
                                refundPercentage = 100;
                        }

                        BigDecimal refundAmount = tourRequest.getPaidAmount()
                                        .multiply(BigDecimal.valueOf(refundPercentage))
                                        .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);

                        User user = tourRequest.getUser();
                        user.setBalance((user.getBalance() != null ? user.getBalance() : BigDecimal.ZERO)
                                        .add(refundAmount));
                        userRepository.save(user);

                        String txNote = "Hoàn tiền " + refundPercentage + "% từ phán quyết khiếu nại (Custom): "
                                        + tourRequest.getRequestCode();
                        if (adminNote != null && !adminNote.isEmpty()) {
                                txNote += " — " + adminNote;
                        }

                        transactionRepository.save(Transaction.builder()
                                        .tourRequest(tourRequest)
                                        .user(user)
                                        .amount(refundAmount)
                                        .type(TransactionType.REFUND)
                                        .note(txNote)
                                        .build());

                        tourRequest.setDisputed(false);
                        tourRequest.setPaidOut(true);
                        tourRequest.setRefundAmount(refundAmount);

                        // DISBURSE REMAINING TO GUIDE IMMEDIATELY
                        BigDecimal remainingAmount = tourRequest.getPaidAmount().subtract(refundAmount);
                        if (remainingAmount.compareTo(BigDecimal.ZERO) > 0) {
                                BigDecimal guideIncome = remainingAmount.multiply(BigDecimal.valueOf(0.8))
                                                .setScale(0, RoundingMode.HALF_UP);

                                User guide = tourRequest.getGuide();
                                guide.setBalance((guide.getBalance() != null ? guide.getBalance() : BigDecimal.ZERO)
                                                .add(guideIncome));
                                userRepository.save(guide);

                                transactionRepository.save(Transaction.builder()
                                                .tourRequest(tourRequest)
                                                .user(guide)
                                                .amount(guideIncome)
                                                .type(TransactionType.INCOME)
                                                .note("Thanh toán 80% số tiền còn lại sau khi bồi hoàn "
                                                                + refundPercentage + "% cho khách (Custom): "
                                                                + (tourRequest.getRequestCode() != null
                                                                                ? tourRequest.getRequestCode()
                                                                                : tourRequest.getId()))
                                                .build());

                                // DISBURSE PLATFORM FEE (20%) TO ADMIN
                                BigDecimal platformFee = remainingAmount.subtract(guideIncome);
                                if (platformFee.compareTo(BigDecimal.ZERO) > 0) {
                                        List<User> admins = userRepository.findAllByRoleName(RoleName.ADMIN);
                                        if (!admins.isEmpty()) {
                                                User admin = admins.get(0);
                                                admin.setBalance((admin.getBalance() != null ? admin.getBalance()
                                                                : BigDecimal.ZERO).add(platformFee));
                                                userRepository.save(admin);

                                                transactionRepository.save(Transaction.builder()
                                                                .tourRequest(tourRequest)
                                                                .user(admin)
                                                                .amount(platformFee)
                                                                .type(TransactionType.COMMISSION)
                                                                .note("Thu phí sàn (20% của phần còn lại) từ yêu cầu: "
                                                                                + (tourRequest.getRequestCode() != null
                                                                                                ? tourRequest.getRequestCode()
                                                                                                : tourRequest.getTitle()))
                                                                .build());
                                        }
                                }
                        }

                        notificationService.sendNotification(user.getId(),
                                        "Bồi hoàn thành công (Custom)",
                                        "Bạn đã được hoàn " + refundPercentage + "% (" + refundAmount
                                                        + " VND) cho yêu cầu "
                                                        + (tourRequest.getRequestCode() != null
                                                                        ? tourRequest.getRequestCode()
                                                                        : tourRequest.getTitle())
                                                        + " theo phán quyết của Admin."
                                                        + (adminNote != null && !adminNote.isEmpty()
                                                                        ? " Lý do: " + adminNote
                                                                        : ""),
                                        "DISPUTE_RESOLVED_REFUND");

                        notificationService.sendNotification(tourRequest.getGuide().getId(),
                                        "Kết quả phân xử khiếu nại (Custom)",
                                        "Khiếu nại yêu cầu "
                                                        + (tourRequest.getRequestCode() != null
                                                                        ? tourRequest.getRequestCode()
                                                                        : tourRequest.getTitle())
                                                        + " đã được chấp thuận. Hệ thống đã hoàn " + refundPercentage
                                                        + "% cho khách hàng. Số tiền còn lại đã được cộng vào ví của bạn.",
                                        "DISPUTE_RESOLVED_REFUND_GUIDE");
                }

                return mapToResponse(tourRequestRepository.save(tourRequest));
        }
}
