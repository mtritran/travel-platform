package com.mtritran.travelplatform.service;

import com.mtritran.travelplatform.dto.request.TourRequestCreateRequest;
import com.mtritran.travelplatform.dto.response.TourRequestResponse;
import com.mtritran.travelplatform.entity.Location;
import java.math.BigDecimal;
import com.mtritran.travelplatform.entity.TourRequest;
import com.mtritran.travelplatform.entity.User;
import com.mtritran.travelplatform.enums.TourRequestStatus;
import com.mtritran.travelplatform.exception.AppException;
import com.mtritran.travelplatform.exception.ErrorCode;
import com.mtritran.travelplatform.mapper.TourRequestMapper;
import com.mtritran.travelplatform.repository.LocationRepository;
import com.mtritran.travelplatform.repository.TourRequestRepository;
import com.mtritran.travelplatform.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TourRequestService {
    TourRequestRepository tourRequestRepository;
    com.mtritran.travelplatform.repository.TourRequestInterestRepository tourRequestInterestRepository;
    UserRepository userRepository;
    LocationRepository locationRepository;
    TourRequestMapper tourRequestMapper;
    NotificationService notificationService;

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
                .expiresAt(java.time.Instant.now().plus(expiryHrs, java.time.temporal.ChronoUnit.HOURS))
                .meetingLocationName(request.getMeetingLocationName())
                .meetingLatitude(request.getMeetingLatitude())
                .meetingLongitude(request.getMeetingLongitude())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .depositPercentage(request.getDepositPercentage() != null ? request.getDepositPercentage() : java.math.BigDecimal.valueOf(30))
                .paymentStatus("PENDING")
                .build();

        TourRequest saved = tourRequestRepository.save(tourRequest);

        // Broadcast to all guides about new request
        notificationService.broadcastNotification("requests", 
            java.util.Map.of(
                "type", "NEW_TOUR_REQUEST",
                "message", "Có một yêu cầu tour mới: " + tourRequest.getTitle()
            ));

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
            tourRequest.getExpiresAt().isBefore(java.time.Instant.now())) {
            response.setStatus(TourRequestStatus.EXPIRED);
        }

        // Populate interest list
        List<com.mtritran.travelplatform.entity.TourRequestInterest> interests = 
            tourRequestInterestRepository.findByTourRequestIdOrderByCreatedAtAsc(tourRequest.getId());
        
        response.setInterestedGuides(interests.stream().map(interest -> 
            com.mtritran.travelplatform.dto.response.TourRequestInterestResponse.builder()
                .id(interest.getId())
                .guideId(interest.getGuide().getId())
                .guideName(interest.getGuide().getFullName())
                .guideEmail(interest.getGuide().getEmail())
                .guidePhone(interest.getGuide().getPhone())
                .message(interest.getMessage())
                .createdAt(interest.getCreatedAt())
                .build()
        ).toList());

        return response;
    }

    public List<TourRequestResponse> getAllOpenRequests() {
        return tourRequestRepository.findAllByStatusOrderByCreatedAtDesc(TourRequestStatus.OPEN).stream()
                .filter(req -> req.getExpiresAt() == null || req.getExpiresAt().isAfter(java.time.Instant.now()))
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
                .filter(req -> req.getExpiresAt() == null || req.getExpiresAt().isAfter(java.time.Instant.now()))
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

        if (tourRequest.getStatus() != TourRequestStatus.OPEN) {
            throw new AppException(ErrorCode.INVALID_BOOKING_STATUS);
        }

        if (tourRequestInterestRepository.existsByTourRequestIdAndGuideId(requestId, guide.getId())) {
             throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION); // Already interested
        }

        com.mtritran.travelplatform.entity.TourRequestInterest interest = com.mtritran.travelplatform.entity.TourRequestInterest.builder()
                .tourRequest(tourRequest)
                .guide(guide)
                .message(message)
                .build();
        
        tourRequestInterestRepository.save(interest);

        // Notify Customer
        notificationService.sendNotification(tourRequest.getUser().getId(), 
            java.util.Map.of(
                "type", "NEW_GUIDE_INTEREST", 
                "message", "HDV " + guide.getFullName() + " quan tâm đến chuyến đi của bạn: " + tourRequest.getTitle(),
                "requestId", tourRequest.getId()
            ));

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
            java.util.Map.of(
                "type", "TOUR_REQUEST_SELECTED", 
                "message", "Bạn đã được chọn cho yêu cầu: " + tourRequest.getTitle() + ". Hãy xác nhận hoặc từ chối nhé!",
                "requestId", saved.getId()
            ));

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
             BigDecimal depositPercent = tourRequest.getDepositPercentage() != null ? 
                     tourRequest.getDepositPercentage() : BigDecimal.valueOf(30);
             BigDecimal depositAmount = total.multiply(depositPercent).divide(BigDecimal.valueOf(100));
             tourRequest.setDepositAmount(depositAmount);
        }

        TourRequest saved = tourRequestRepository.save(tourRequest);
 
        // Notify Customer
        notificationService.sendNotification(tourRequest.getUser().getId(), 
            java.util.Map.of(
                "type", "TOUR_REQUEST_MATCHED", 
                "message", "HDV " + guide.getFullName() + " đã xác nhận và đang chờ bạn thanh toán cho: " + tourRequest.getTitle(),
                "requestId", saved.getId()
            ));

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
        if (tourRequest.getPaidAmount() != null && tourRequest.getPaidAmount().compareTo(java.math.BigDecimal.ZERO) > 0) {
            User customer = tourRequest.getUser();
            java.math.BigDecimal currentBalance = customer.getBalance() != null ? customer.getBalance() : java.math.BigDecimal.ZERO;
            customer.setBalance(currentBalance.add(tourRequest.getPaidAmount()));
            userRepository.save(customer);

            // Notify Customer about refund
            notificationService.sendNotification(customer.getId(), java.util.Map.of(
                "type", "REFUND_PROCESSED",
                "message", "Bạn đã nhận được hoàn tiền " + tourRequest.getPaidAmount() + " VND từ yêu cầu bị từ chối: " + tourRequest.getTitle(),
                "requestId", tourRequest.getId()
            ));
        }

        tourRequest.setStatus(TourRequestStatus.OPEN);
        tourRequest.setGuide(null);
        tourRequest.setPaidAmount(java.math.BigDecimal.ZERO);
        tourRequest.setPaymentStatus("PENDING");

        TourRequest saved = tourRequestRepository.save(tourRequest);

        // Notify Customer about decline
        notificationService.sendNotification(tourRequest.getUser().getId(), 
            java.util.Map.of(
                "type", "TOUR_REQUEST_DECLINED", 
                "message", "Tiếc quá, HDV " + guide.getFullName() + " hiện đang bận nên đã từ chối yêu cầu của bạn. Hệ thống đã mở lại tour và hoàn tiền (nếu có).",
                "requestId", saved.getId()
            ));

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

        // Refund if necessary
        if (tourRequest.getPaidAmount() != null && tourRequest.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal currentBalance = user.getBalance() != null ? user.getBalance() : BigDecimal.ZERO;
            user.setBalance(currentBalance.add(tourRequest.getPaidAmount()));
            userRepository.save(user);

            notificationService.sendNotification(user.getId(), java.util.Map.of(
                "type", "REFUND_PROCESSED",
                "message", "Hoàn tiền " + tourRequest.getPaidAmount() + " VND cho yêu cầu bị hủy: " + tourRequest.getTitle()
            ));
        }

        tourRequest.setStatus(TourRequestStatus.OPEN);
        tourRequest.setGuide(null);
        tourRequest.setPaidAmount(BigDecimal.ZERO);
        tourRequest.setPaymentStatus("PENDING");
        
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
            tourRequest.setExpiresAt(java.time.Instant.now().plus(request.getExpiryHours(), java.time.temporal.ChronoUnit.HOURS));
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

        BigDecimal deposit = tourRequest.getDepositAmount() != null ? tourRequest.getDepositAmount() : BigDecimal.ZERO;
        BigDecimal currentBalance = customer.getBalance() != null ? customer.getBalance() : BigDecimal.ZERO;

        if (currentBalance.compareTo(deposit) < 0) {
             throw new AppException(ErrorCode.INSUFFICIENT_BALANCE);
        }

        // Deduct balance
        customer.setBalance(currentBalance.subtract(deposit));
        userRepository.save(customer);

        tourRequest.setPaidAmount(deposit);
        tourRequest.setPaymentStatus("PAID_DEPOSIT");
        tourRequest.setStatus(TourRequestStatus.CONFIRMED);

        TourRequest saved = tourRequestRepository.save(tourRequest);

        // Notify Guide
        notificationService.sendNotification(tourRequest.getGuide().getId(), 
            java.util.Map.of(
                "type", "TOUR_REQUEST_PAID", 
                "message", "Khách hàng " + customer.getFullName() + " đã thanh toán cọc cho yêu cầu: " + tourRequest.getTitle(),
                "requestId", saved.getId()
            ));

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

        if (tourRequest.getStatus() != TourRequestStatus.CONFIRMED || !"PAID_DEPOSIT".equals(tourRequest.getPaymentStatus())) {
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
        tourRequest.setPaymentStatus("PAID_FULL");

        return mapToResponse(tourRequestRepository.save(tourRequest));
    }

    @Transactional
    public void applyVnpayDepositSuccess(String requestId) {
        TourRequest tourReq = tourRequestRepository.findById(requestId)
                .orElseThrow(() -> new AppException(ErrorCode.TOUR_REQUEST_NOT_FOUND));

        tourReq.setPaidAmount(tourReq.getDepositAmount());
        tourReq.setPaymentStatus("PAID_DEPOSIT");
        tourReq.setStatus(TourRequestStatus.CONFIRMED);
        tourRequestRepository.save(tourReq);

        // Notify Guide
        if (tourReq.getGuide() != null) {
            notificationService.sendNotification(tourReq.getGuide().getId(), 
                java.util.Map.of(
                    "type", "TOUR_REQUEST_PAID", 
                    "message", "Khách hàng " + tourReq.getUser().getFullName() + " đã thanh toán cọc cho yêu cầu: " + tourReq.getTitle(),
                    "requestId", tourReq.getId()
                ));
        }
    }

    @Transactional
    public void applyVnpayRemainingSuccess(String requestId) {
        TourRequest tourReq = tourRequestRepository.findById(requestId)
                .orElseThrow(() -> new AppException(ErrorCode.TOUR_REQUEST_NOT_FOUND));

        tourReq.setPaidAmount(tourReq.getBudget());
        tourReq.setPaymentStatus("PAID_FULL");
        tourRequestRepository.save(tourReq);
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

        if (tourRequest.getStatus() != TourRequestStatus.CONFIRMED || !"PAID_FULL".equals(tourRequest.getPaymentStatus())) {
             throw new AppException(ErrorCode.INVALID_BOOKING_STATUS);
        }

        // Logic check: only allow completion after the tour has started
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        java.time.LocalDateTime tourStart = java.time.LocalDateTime.of(tourRequest.getPlannedDate(), tourRequest.getStartTime());
        if (now.isBefore(tourStart)) {
            throw new AppException(ErrorCode.TOUR_NOT_STARTED_YET);
        }

        tourRequest.setStatus(TourRequestStatus.COMPLETED);
        
        // Add funds to guide
        guide.setBalance(guide.getBalance().add(tourRequest.getBudget()));
        userRepository.save(guide);

        return mapToResponse(tourRequestRepository.save(tourRequest));
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
        boolean isExpired = tourRequest.getExpiresAt() != null && tourRequest.getExpiresAt().isBefore(java.time.Instant.now());

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
}
