package com.mtritran.travelplatform.repository;

import com.mtritran.travelplatform.entity.Review;
import com.mtritran.travelplatform.entity.Tour;
import com.mtritran.travelplatform.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, String> {
    List<Review> findAllByTour(Tour tour);
    List<Review> findAllByTourAndActive(Tour tour, boolean active);
    
    List<Review> findAllByTour_Guide(User guide);

    @Query("SELECT r FROM Review r LEFT JOIN r.tour t LEFT JOIN r.tourRequest tr WHERE (t IS NOT NULL AND t.guide.id = ?1) OR (tr IS NOT NULL AND tr.guide.id = ?1) ORDER BY r.createdAt DESC")
    List<Review> findAllByGuideId(String guideId);

    @Query("SELECT r FROM Review r LEFT JOIN r.tour t LEFT JOIN r.tourRequest tr WHERE ((t IS NOT NULL AND t.guide.id = ?1) OR (tr IS NOT NULL AND tr.guide.id = ?1)) AND r.active = ?2 ORDER BY r.createdAt DESC")
    List<Review> findAllByGuideIdAndActive(String guideId, boolean active);

    List<Review> findAllByOrderByCreatedAtDesc();

    Optional<Review> findByBookingId(String bookingId);

    boolean existsByBookingId(String bookingId);

    boolean existsByTourRequestId(String tourRequestId);
}
