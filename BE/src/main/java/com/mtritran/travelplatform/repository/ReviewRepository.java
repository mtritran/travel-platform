package com.mtritran.travelplatform.repository;

import com.mtritran.travelplatform.entity.Review;
import com.mtritran.travelplatform.entity.Tour;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, String> {
    List<Review> findAllByTour(Tour tour);
    Optional<Review> findByBookingId(String bookingId);
    boolean existsByBookingId(String bookingId);
}
