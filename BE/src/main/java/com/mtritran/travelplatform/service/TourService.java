package com.mtritran.travelplatform.service;

import com.mtritran.travelplatform.enums.TourStatus;

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
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;

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

        // Calculate occupied guests for the specific tour slot
        java.time.Instant expiryTime = java.time.Instant.now().minus(java.time.Duration.ofMinutes(10));
        Integer occupied = bookingRepository.sumOccupiedSlots(tour.getId(), tour.getStartDate(), tour.getStartTime(), expiryTime);
        response.setOccupiedGuests(occupied != null ? occupied : 0);

        return response;
    }

    public TourResponse createTour(TourCreateRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User guide = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        // Penalty Check: Block banned guides
        if (guide.getGuideBannedUntil() != null && guide.getGuideBannedUntil().isAfter(java.time.Instant.now())) {
            throw new AppException(ErrorCode.UNAUTHORIZED); // Or customize error: GUIDE_BANNED
        }

        Location location = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> new AppException(ErrorCode.LOCATION_NOT_FOUND));

        Location meetingLocation = locationRepository.findById(request.getMeetingLocationId())
                .orElseThrow(() -> new AppException(ErrorCode.LOCATION_NOT_FOUND));

        // Validate date and time accounting for booking cutoff
        int cutoff = request.getBookingCutoffMinutes() != null ? request.getBookingCutoffMinutes() : 60;
        java.time.LocalDateTime startDateTime = java.time.LocalDateTime.of(request.getStartDate(), request.getStartTime());
        java.time.LocalDateTime cutoffDateTime = startDateTime.minusMinutes(cutoff);
        
        // Use a 5-minute buffer for network/server delay
        if (cutoffDateTime.isBefore(java.time.LocalDateTime.now().plusMinutes(5))) {
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
                .bookingCutoffMinutes(request.getBookingCutoffMinutes() != null ? request.getBookingCutoffMinutes() : 60)
                .status(TourStatus.ACTIVE)
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
        java.time.Instant expiryTime = java.time.Instant.now().minus(java.time.Duration.ofMinutes(10));
        java.time.LocalDateTime vnNow = java.time.LocalDateTime.now(zoneId);
        return tourRepository.findAvailableTours(java.time.LocalDate.now(zoneId), java.time.LocalTime.now(zoneId), expiryTime).stream()
                .filter(t -> {
                    Integer cutoff = t.getBookingCutoffMinutes() != null ? t.getBookingCutoffMinutes() : 60;
                    java.time.LocalDateTime cutoffPoint = java.time.LocalDateTime.of(t.getStartDate(), t.getStartTime()).minusMinutes(cutoff);
                    return vnNow.isBefore(cutoffPoint);
                })
                .map(this::mapWithRating)
                .toList();
    }

    public List<TourResponse> getNearbyTours(double lat, double lng, double radius) {
        java.time.ZoneId zoneId = java.time.ZoneId.of("Asia/Ho_Chi_Minh");
        java.time.Instant expiryTime = java.time.Instant.now().minus(java.time.Duration.ofMinutes(10));
        java.time.LocalDateTime vnNow = java.time.LocalDateTime.now(zoneId);
        return tourRepository.findNearbyTours(lat, lng, radius, java.time.LocalDate.now(zoneId), java.time.LocalTime.now(zoneId), expiryTime).stream()
                .filter(t -> {
                    Integer cutoff = t.getBookingCutoffMinutes() != null ? t.getBookingCutoffMinutes() : 60;
                    java.time.LocalDateTime cutoffPoint = java.time.LocalDateTime.of(t.getStartDate(), t.getStartTime()).minusMinutes(cutoff);
                    return vnNow.isBefore(cutoffPoint);
                })
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

        // Logic check: If have active bookings and not finished, block critical changes
        java.time.Instant tenMinsAgo = java.time.Instant.now().minus(java.time.Duration.ofMinutes(10));
        long activeCount = bookingRepository.countActiveBookings(id, tenMinsAgo);

        java.time.ZoneId vnZone = java.time.ZoneId.of("Asia/Ho_Chi_Minh");
        java.time.LocalDateTime vnNow = java.time.LocalDateTime.now(vnZone);
        
        // Use endDate and endTime to determine completion. Fallback to start if end missing.
        java.time.LocalDate effectiveEndDate = tour.getEndDate() != null ? tour.getEndDate() : tour.getStartDate();
        java.time.LocalTime effectiveEndTime = tour.getEndTime() != null ? tour.getEndTime() : tour.getStartTime().plusHours(4); // default 4h if missing
        java.time.LocalDateTime tourEnd = java.time.LocalDateTime.of(effectiveEndDate, effectiveEndTime);

        if (activeCount > 0 && vnNow.isBefore(tourEnd)) {
            // Check if critical fields changed
            boolean criticalChanged = !tour.getStartDate().equals(request.getStartDate())
                    || !tour.getStartTime().equals(request.getStartTime())
                    || tour.getPrice().compareTo(request.getPrice()) != 0
                    || !tour.getLocation().getId().equals(request.getLocationId());
            
            // Also check endDate/endTime specifically
            if (tour.getEndDate() != null && !tour.getEndDate().equals(request.getEndDate())) criticalChanged = true;
            if (tour.getEndTime() != null && !tour.getEndTime().equals(request.getEndTime())) criticalChanged = true;

            if (criticalChanged) {
                throw new AppException(ErrorCode.TOUR_CANNOT_UPDATE_DATE_TIME);
            }
        }

        tour.setTitle(request.getTitle());
        tour.setDescription(request.getDescription());
        tour.setPrice(request.getPrice());
        tour.setImageUrl(request.getImageUrl());
        tour.setStartDate(request.getStartDate());
        tour.setEndDate(request.getEndDate());
        tour.setStartTime(request.getStartTime());
        tour.setEndTime(request.getEndTime());
        tour.setMaxGuests(request.getMaxGuests() != null ? request.getMaxGuests() : 1);
        tour.setDepositPercentage(request.getDepositPercentage());
        tour.setBookingCutoffMinutes(request.getBookingCutoffMinutes());
        
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

        // Validate new timing
        int newCutoff = request.getBookingCutoffMinutes() != null ? request.getBookingCutoffMinutes() : 60;
        java.time.LocalDateTime newStart = java.time.LocalDateTime.of(request.getStartDate(), request.getStartTime());
        java.time.LocalDateTime newCutoffPoint = newStart.minusMinutes(newCutoff);
        
        if (newCutoffPoint.isBefore(java.time.LocalDateTime.now().plusMinutes(5))) {
            throw new AppException(ErrorCode.INVALID_TOUR_DATE);
        }

        return mapWithRating(tourRepository.save(tour));
    }

    public TourResponse updateTourStatus(String id, TourStatus status, String reason) {
        Tour tour = tourRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.TOUR_NOT_FOUND));
        
        // Ownership or admin check
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));
        
        boolean isAdmin = currentUser.getRoles().stream().anyMatch(r -> r.getName() == com.mtritran.travelplatform.enums.RoleName.ADMIN);
        boolean isOwner = tour.getGuide().getId().equals(currentUser.getId());

        if (isAdmin) {
            tour.setStatus(status);
            if (status == TourStatus.ACTIVE) {
                tour.setHiddenReason(null); // Clear reason if re-activated
            } else if (reason != null) {
                tour.setHiddenReason(reason);
            }
        } else if (isOwner) {
            // Guide can only toggle between ACTIVE and INACTIVE, and only if it was already approved
            if (tour.getStatus() == TourStatus.PENDING_APPROVAL || tour.getStatus() == TourStatus.REJECTED) {
                 throw new AppException(ErrorCode.UNAUTHORIZED);
            }
            if (status == TourStatus.ACTIVE || status == TourStatus.INACTIVE) {
                tour.setStatus(status);
            } else {
                throw new AppException(ErrorCode.UNAUTHORIZED);
            }
        } else {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        return mapWithRating(tourRepository.save(tour));
    }

    public List<TourResponse> getPendingTours() {
        return tourRepository.findAllByStatus(TourStatus.PENDING_APPROVAL).stream()
                .map(this::mapWithRating)
                .toList();
    }

    public void deleteTour(String id) {
        Tour tour = tourRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.TOUR_NOT_FOUND));

        if (bookingRepository.existsByTour(tour)) {
            throw new AppException(ErrorCode.TOUR_HAS_BOOKINGS);
        }

        tourRepository.delete(tour);
    }

    @Bean
    public ApplicationRunner migrationRunner() {
        return args -> {
            try {
                tourRepository.updateNullStatuses();
                System.out.println("Tour status migration completed successfully.");
            } catch (Exception e) {
                System.err.println("Migration warning: " + e.getMessage());
            }
        };
    }
}
