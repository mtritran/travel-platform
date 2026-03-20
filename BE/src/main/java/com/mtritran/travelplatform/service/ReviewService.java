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
    UserRepository userRepository;
    ReviewMapper reviewMapper;

    @Transactional
    public ReviewResponse createReview(ReviewCreateRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

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

        Review review = Review.builder()
                .booking(booking)
                .user(user)
                .tour(booking.getTour())
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        return reviewMapper.toResponse(reviewRepository.save(review));
    }

    public List<ReviewResponse> getReviewsByTour(String tourId) {
        Tour tour = tourRepository.findById(tourId)
                .orElseThrow(() -> new AppException(ErrorCode.TOUR_NOT_FOUND));
        
        return reviewRepository.findAllByTour(tour).stream()
                .map(reviewMapper::toResponse)
                .toList();
    }
}
