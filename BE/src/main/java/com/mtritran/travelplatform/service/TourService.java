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
import com.mtritran.travelplatform.repository.BookingRepository;
import com.mtritran.travelplatform.repository.ReviewRepository;
import com.mtritran.travelplatform.entity.Review;
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
    BookingRepository bookingRepository;
    ReviewRepository reviewRepository;
    TourMapper tourMapper;

    private TourResponse mapWithRating(Tour tour) {
        TourResponse response = tourMapper.toResponse(tour);
        List<Review> reviews = reviewRepository.findAllByTour(tour);
        if (!reviews.isEmpty()) {
            double avgRating = reviews.stream()
                    .mapToInt(Review::getRating)
                    .average()
                    .orElse(0.0);
            response.setRating(avgRating);
            response.setReviewCount(reviews.size());
        } else {
            response.setRating(5.0); // Default for new tours
            response.setReviewCount(0);
        }
        return response;
    }

    public TourResponse createTour(TourCreateRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User guide = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        Location location = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> new AppException(ErrorCode.LOCATION_NOT_FOUND));

        Location meetingLocation = locationRepository.findById(request.getMeetingLocationId())
                .orElseThrow(() -> new AppException(ErrorCode.LOCATION_NOT_FOUND));

        // Validate date and time
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        java.time.LocalDateTime startDateTime = java.time.LocalDateTime.of(request.getStartDate(), request.getStartTime());
        
        if (startDateTime.isBefore(now)) {
            throw new AppException(ErrorCode.INVALID_TOUR_DATE);
        }

        Tour tour = Tour.builder()
                .guide(guide)
                .location(location)
                .meetingLocation(meetingLocation)
                .title(request.getTitle())
                .description(request.getDescription())
                .price(request.getPrice())
                .imageUrl(request.getImageUrl())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .maxGuests(request.getMaxGuests() != null ? request.getMaxGuests() : 1)
                .active(true)
                .build();

        return mapWithRating(tourRepository.save(tour));
    }

    public List<TourResponse> getMyTours() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User guide = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));
        return tourRepository.findAllByGuide(guide).stream()
                .map(this::mapWithRating)
                .toList();
    }

    public List<TourResponse> getAllActiveTours() {
        java.time.ZoneId zoneId = java.time.ZoneId.of("Asia/Ho_Chi_Minh");
        return tourRepository.findAvailableTours(java.time.LocalDate.now(zoneId), java.time.LocalTime.now(zoneId)).stream()
                .map(this::mapWithRating)
                .toList();
    }

    public List<TourResponse> getNearbyTours(double lat, double lng, double radius) {
        java.time.ZoneId zoneId = java.time.ZoneId.of("Asia/Ho_Chi_Minh");
        return tourRepository.findNearbyTours(lat, lng, radius, java.time.LocalDate.now(zoneId), java.time.LocalTime.now(zoneId)).stream()
                .map(this::mapWithRating)
                .toList();
    }

    public TourResponse getTourById(String id) {
        return tourRepository.findById(id)
                .map(this::mapWithRating)
                .orElseThrow(() -> new AppException(ErrorCode.TOUR_NOT_FOUND));
    }

    public org.springframework.data.domain.Page<TourResponse> getAllTours(org.springframework.data.domain.Pageable pageable) {
        return tourRepository.findAll(pageable)
                .map(this::mapWithRating);
    }

    public TourResponse updateTour(String id, TourCreateRequest request) {
        Tour tour = tourRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.TOUR_NOT_FOUND));
        
        // Basic check for guide ownership
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!tour.getGuide().getEmail().equals(email)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        tour.setTitle(request.getTitle());
        tour.setDescription(request.getDescription());
        tour.setPrice(request.getPrice());
        tour.setImageUrl(request.getImageUrl());
        tour.setStartDate(request.getStartDate());
        tour.setEndDate(request.getEndDate());
        tour.setStartTime(request.getStartTime());
        tour.setEndTime(request.getEndTime());
        tour.setMaxGuests(request.getMaxGuests());
        tour.setDepositPercentage(request.getDepositPercentage());
        
        if (request.getLocationId() != null) {
            Location location = locationRepository.findById(request.getLocationId())
                    .orElseThrow(() -> new AppException(ErrorCode.LOCATION_NOT_FOUND));
            tour.setLocation(location);
        }

        if (request.getMeetingLocationId() != null) {
            Location meetingLoc = locationRepository.findById(request.getMeetingLocationId())
                    .orElseThrow(() -> new AppException(ErrorCode.LOCATION_NOT_FOUND));
            tour.setMeetingLocation(meetingLoc);
        }

        return mapWithRating(tourRepository.save(tour));
    }

    public TourResponse toggleTourStatus(String id) {
        Tour tour = tourRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.TOUR_NOT_FOUND));
        tour.setActive(!tour.isActive());
        return mapWithRating(tourRepository.save(tour));
    }

    public void deleteTour(String id) {
        Tour tour = tourRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.TOUR_NOT_FOUND));

        if (bookingRepository.existsByTour(tour)) {
            throw new AppException(ErrorCode.TOUR_HAS_BOOKINGS);
        }

        tourRepository.delete(tour);
    }
}
