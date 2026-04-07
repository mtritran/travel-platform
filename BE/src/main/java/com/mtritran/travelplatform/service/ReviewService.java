package com.mtritran.travelplatform.service;

import com.mtritran.travelplatform.dto.request.ReviewCreateRequest;
import com.mtritran.travelplatform.dto.response.ReviewResponse;
import com.mtritran.travelplatform.entity.Booking;
import com.mtritran.travelplatform.entity.Review;
import com.mtritran.travelplatform.entity.Tour;
import com.mtritran.travelplatform.entity.User;
import com.mtritran.travelplatform.enums.BookingStatus;
import com.mtritran.travelplatform.exception.AppException;
import com.mtritran.travelplatform.exception.ErrorCode;
import com.mtritran.travelplatform.mapper.ReviewMapper;
import com.mtritran.travelplatform.repository.BookingRepository;
import com.mtritran.travelplatform.repository.ReviewRepository;
import com.mtritran.travelplatform.repository.TourRepository;
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
public class ReviewService {
    ReviewRepository reviewRepository;
    BookingRepository bookingRepository;
    TourRepository tourRepository;
    com.mtritran.travelplatform.repository.TourRequestRepository tourRequestRepository;
    UserRepository userRepository;
    ReviewMapper reviewMapper;
    StorageService storageService;

    @Transactional
    public ReviewResponse createReview(ReviewCreateRequest request, List<org.springframework.web.multipart.MultipartFile> files) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        // Handle multiple image uploads
        String imagesUrl = "";
        if (files != null && !files.isEmpty()) {
            List<String> storedPaths = files.stream()
                    .map(file -> storageService.saveFile(file, "reviews"))
                    .toList();
            imagesUrl = String.join(";", storedPaths);
        }

        Review.ReviewBuilder reviewBuilder = Review.builder()
                .user(user)
                .rating(request.getRating())
                .comment(request.getComment())
                .imagesUrl(imagesUrl);

        if (request.getBookingId() != null) {
            Booking booking = bookingRepository.findById(request.getBookingId())
                    .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

            if (!booking.getUser().getId().equals(user.getId())) {
                throw new AppException(ErrorCode.UNAUTHORIZED);
            }

            if (booking.getStatus() != BookingStatus.COMPLETED) {
                throw new AppException(ErrorCode.INVALID_BOOKING_STATUS);
            }

            if (reviewRepository.existsByBookingId(booking.getId())) {
                throw new AppException(ErrorCode.ALREADY_REVIEWED);
            }

            reviewBuilder.booking(booking).tour(booking.getTour());
        } else if (request.getTourRequestId() != null) {
            com.mtritran.travelplatform.entity.TourRequest tourRequest = tourRequestRepository.findById(request.getTourRequestId())
                    .orElseThrow(() -> new AppException(ErrorCode.TOUR_REQUEST_NOT_FOUND));

            if (!tourRequest.getUser().getId().equals(user.getId())) {
                throw new AppException(ErrorCode.UNAUTHORIZED);
            }

            if (tourRequest.getStatus() != com.mtritran.travelplatform.enums.TourRequestStatus.COMPLETED) {
                throw new AppException(ErrorCode.INVALID_BOOKING_STATUS);
            }

            if (reviewRepository.existsByTourRequestId(tourRequest.getId())) {
                throw new AppException(ErrorCode.ALREADY_REVIEWED);
            }

            reviewBuilder.tourRequest(tourRequest);
        } else {
             throw new AppException(ErrorCode.INVALID_KEY);
        }

        return reviewMapper.toResponse(reviewRepository.save(reviewBuilder.build()));
    }

    public List<ReviewResponse> getReviewsByTour(String tourId) {
        Tour tour = tourRepository.findById(tourId)
                .orElseThrow(() -> new AppException(ErrorCode.TOUR_NOT_FOUND));
        
        return reviewRepository.findAllByTourAndActive(tour, true).stream()
                .map(reviewMapper::toResponse)
                .toList();
    }

    public List<ReviewResponse> getReviewsByGuide(String guideId) {
        return reviewRepository.findAllByGuideIdAndActive(guideId, true).stream()
                .map(reviewMapper::toResponse)
                .toList();
    }

    // Admin methods
    public List<ReviewResponse> getAllReviewsForAdmin() {
        return reviewRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(reviewMapper::toResponse)
                .toList();
    }

    @Transactional
    public void updateReviewStatus(String id, boolean active) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_KEY));
        review.setActive(active);
        reviewRepository.save(review);
    }

    @Transactional
    public void deleteReview(String id) {
        if (!reviewRepository.existsById(id)) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }
        reviewRepository.deleteById(id);
    }
}
