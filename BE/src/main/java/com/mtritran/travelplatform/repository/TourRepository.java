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

    @Query(value = "SELECT t.* FROM tours t " +
            "JOIN locations l ON t.location_id = l.id " +
            "WHERE t.active = true AND " +
            "(6371 * acos(cos(radians(:lat)) * cos(radians(l.latitude)) * " +
            "cos(radians(l.longitude) - radians(:lng)) + " +
            "sin(radians(:lat)) * sin(radians(l.latitude)))) <= :radius " +
            "ORDER BY (6371 * acos(cos(radians(:lat)) * cos(radians(l.latitude)) * " +
            "cos(radians(l.longitude) - radians(:lng)) + " +
            "sin(radians(:lat)) * sin(radians(l.latitude)))) ASC", nativeQuery = true)
    List<Tour> findNearbyTours(@Param("lat") double lat, 
                               @Param("lng") double lng, 
                               @Param("radius") double radius);
}
