package com.mtritran.travelplatform.service;

import com.mtritran.travelplatform.dto.request.TourRequestCreateRequest;
import com.mtritran.travelplatform.dto.response.TourRequestResponse;
import com.mtritran.travelplatform.entity.Location;
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
                .build();

        TourRequest saved = tourRequestRepository.save(tourRequest);

        // Broadcast to all guides about new request
        notificationService.broadcastNotification("requests", 
            java.util.Map.of(
                "type", "NEW_TOUR_REQUEST",
                "message", "Có một yêu cầu tour mới: " + tourRequest.getTitle()
            ));

        return tourRequestMapper.toResponse(saved);
    }

    public List<TourRequestResponse> getAllOpenRequests() {
        return tourRequestRepository.findAllByStatus(TourRequestStatus.OPEN).stream()
                .map(tourRequestMapper::toResponse)
                .toList();
    }

    public List<TourRequestResponse> getMyRequests() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));
        return tourRequestRepository.findAllByUser(user).stream()
                .map(tourRequestMapper::toResponse)
                .toList();
    }

    public List<TourRequestResponse> getAcceptedRequests() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User guide = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));
        return tourRequestRepository.findAllByGuide(guide).stream()
                .map(tourRequestMapper::toResponse)
                .toList();
    }

    public List<TourRequestResponse> getNearbyRequests(double lat, double lng, double radius) {
        return tourRequestRepository.findNearbyRequests(lat, lng, radius).stream()
                .map(tourRequestMapper::toResponse)
                .toList();
    }

    @Transactional
    public TourRequestResponse acceptRequest(String requestId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User guide = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        TourRequest tourRequest = tourRequestRepository.findById(requestId)
                .orElseThrow(() -> new AppException(ErrorCode.TOUR_REQUEST_NOT_FOUND));

        if (tourRequest.getUser().getId().equals(guide.getId())) {
            throw new AppException(ErrorCode.CANNOT_ACCEPT_OWN_REQUEST);
        }

        if (tourRequest.getStatus() != TourRequestStatus.OPEN) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }

        tourRequest.setStatus(TourRequestStatus.MATCHED);
        tourRequest.setGuide(guide);

        TourRequest saved = tourRequestRepository.save(tourRequest);

        // Notify Customer real-time
        notificationService.sendNotification(tourRequest.getUser().getId(), 
            java.util.Map.of(
                "type", "TOUR_REQUEST_MATCHED", 
                "message", "HDV " + guide.getFullName() + " đã chấp nhận yêu cầu của bạn: " + tourRequest.getTitle(),
                "requestId", saved.getId()
            ));

        return tourRequestMapper.toResponse(saved);
    }
}
