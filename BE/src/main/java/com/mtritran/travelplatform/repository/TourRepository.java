package com.mtritran.travelplatform.repository;

import com.mtritran.travelplatform.entity.Tour;
import com.mtritran.travelplatform.entity.User;
import com.mtritran.travelplatform.enums.TourStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TourRepository extends JpaRepository<Tour, String> {
    List<Tour> findAllByGuide(User guide);

    List<Tour> findAllByStatus(TourStatus status);
    
    @Modifying
    @Transactional
    @Query(value = "UPDATE tours SET status = 'ACTIVE' WHERE status IS NULL", nativeQuery = true)
    void updateNullStatuses();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM Tour t WHERE t.id = :id")
    Optional<Tour> findByIdWithLock(@Param("id") String id);

    @Query("SELECT t FROM Tour t WHERE t.status = 'ACTIVE' " +
           "AND (t.startDate > :date OR (t.startDate = :date AND t.startTime > :time)) " +
           "AND (SELECT COALESCE(SUM(b.numberOfGuests), 0) FROM Booking b WHERE b.tour.id = t.id " +
           "AND (b.status IN ('CONFIRMED', 'PAID_FULL', 'COMPLETED') " +
           "OR (b.status = 'AWAITING_DEPOSIT' AND b.createdAt > :expiryTime)) " +
           "AND b.bookingDate = t.startDate AND b.startTime = t.startTime) < t.maxGuests")
    List<Tour> findAvailableTours(@Param("date") LocalDate date,
                                 @Param("time") LocalTime time,
                                 @Param("expiryTime") Instant expiryTime);

    @Query(value = "SELECT t.* FROM tours t " +
            "JOIN locations l ON t.location_id = l.id " +
            "WHERE t.status = 'ACTIVE' AND " +
            "(t.start_date > :date OR (t.start_date = :date AND t.start_time > :time)) AND " +
            "(SELECT COALESCE(SUM(b.number_of_guests), 0) FROM bookings b WHERE b.tour_id = t.id " +
            "AND (b.status IN ('CONFIRMED', 'PAID_FULL', 'COMPLETED') " +
            "OR (b.status = 'AWAITING_DEPOSIT' AND b.created_at > :expiryTime)) " +
            "AND b.booking_date = t.start_date AND b.start_time = t.start_time) < t.max_guests AND " +
            "(6371 * acos(cos(radians(:lat)) * cos(radians(l.latitude)) * " +
            "cos(radians(l.longitude) - radians(:lng)) + " +
            "sin(radians(:lat)) * sin(radians(l.latitude)))) <= :radius " +
            "ORDER BY (6371 * acos(cos(radians(:lat)) * cos(radians(l.latitude)) * " +
            "cos(radians(l.longitude) - radians(:lng)) + " +
            "sin(radians(:lat)) * sin(radians(l.latitude)))) ASC", nativeQuery = true)
    List<Tour> findNearbyTours(@Param("lat") double lat, 
                               @Param("lng") double lng, 
                               @Param("radius") double radius,
                               @Param("date") LocalDate date,
                               @Param("time") LocalTime time,
                               @Param("expiryTime") Instant expiryTime);
}
