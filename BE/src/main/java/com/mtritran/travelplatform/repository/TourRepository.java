package com.mtritran.travelplatform.repository;

import com.mtritran.travelplatform.entity.Location;
import com.mtritran.travelplatform.entity.Tour;
import com.mtritran.travelplatform.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TourRepository extends JpaRepository<Tour, String> {
    List<Tour> findAllByGuide(User guide);
    List<Tour> findAllByLocation(Location location);
    List<Tour> findAllByActiveTrue();

    @Query("SELECT t FROM Tour t WHERE t.active = true " +
           "AND (t.startDate > :date OR (t.startDate = :date AND t.startTime > :time)) " +
           "AND (SELECT COALESCE(SUM(b.numberOfGuests), 0) FROM Booking b WHERE b.tour.id = t.id AND b.status != 'CANCELLED') < t.maxGuests")
    List<Tour> findAvailableTours(@Param("date") java.time.LocalDate date, 
                                 @Param("time") java.time.LocalTime time);

    @Query(value = "SELECT t.* FROM tours t " +
            "JOIN locations l ON t.location_id = l.id " +
            "WHERE t.active = true AND " +
            "(t.start_date > :date OR (t.start_date = :date AND t.start_time > :time)) AND " +
            "(SELECT COALESCE(SUM(b.number_of_guests), 0) FROM bookings b WHERE b.tour_id = t.id AND b.status != 'CANCELLED') < t.max_guests AND " +
            "(6371 * acos(cos(radians(:lat)) * cos(radians(l.latitude)) * " +
            "cos(radians(l.longitude) - radians(:lng)) + " +
            "sin(radians(:lat)) * sin(radians(l.latitude)))) <= :radius " +
            "ORDER BY (6371 * acos(cos(radians(:lat)) * cos(radians(l.latitude)) * " +
            "cos(radians(l.longitude) - radians(:lng)) + " +
            "sin(radians(:lat)) * sin(radians(l.latitude)))) ASC", nativeQuery = true)
    List<Tour> findNearbyTours(@Param("lat") double lat, 
                               @Param("lng") double lng, 
                               @Param("radius") double radius,
                               @Param("date") java.time.LocalDate date,
                               @Param("time") java.time.LocalTime time);
}
