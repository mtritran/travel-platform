package com.mtritran.travelplatform.service;

import com.mtritran.travelplatform.dto.request.TourCreateRequest;
import com.mtritran.travelplatform.dto.response.TourResponse;
import com.mtritran.travelplatform.entity.Location;
import com.mtritran.travelplatform.entity.Tour;
import com.mtritran.travelplatform.entity.User;
import com.mtritran.travelplatform.exception.AppException;
import com.mtritran.travelplatform.exception.ErrorCode;
import com.mtritran.travelplatform.mapper.TourMapper;
import com.mtritran.travelplatform.repository.LocationRepository;
import com.mtritran.travelplatform.repository.TourRepository;
import com.mtritran.travelplatform.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TourService {
    TourRepository tourRepository;
    UserRepository userRepository;
    LocationRepository locationRepository;
    TourMapper tourMapper;

    public TourResponse createTour(TourCreateRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User guide = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        Location location = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> new AppException(ErrorCode.LOCATION_NOT_FOUND));

        Tour tour = Tour.builder()
                .guide(guide)
                .location(location)
                .title(request.getTitle())
                .description(request.getDescription())
                .price(request.getPrice())
                .imageUrl(request.getImageUrl())
                .active(true)
                .build();

        return tourMapper.toResponse(tourRepository.save(tour));
    }

    public List<TourResponse> getAllActiveTours() {
        return tourRepository.findAllByActiveTrue().stream()
                .map(tourMapper::toResponse)
                .toList();
    }

    public List<TourResponse> getNearbyTours(double lat, double lng, double radius) {
        return tourRepository.findNearbyTours(lat, lng, radius).stream()
                .map(tourMapper::toResponse)
                .toList();
    }
}
