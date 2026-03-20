package com.mtritran.travelplatform.repository;

import com.mtritran.travelplatform.entity.TourRequest;
import com.mtritran.travelplatform.enums.TourRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TourRequestRepository extends JpaRepository<TourRequest, String> {
    List<TourRequest> findAllByStatus(TourRequestStatus status);
    List<TourRequest> findAllByUser(com.mtritran.travelplatform.entity.User user);
    List<TourRequest> findAllByGuide(com.mtritran.travelplatform.entity.User guide);
    
    @Query(value = "SELECT tr.* FROM tour_requests tr " +
            "LEFT JOIN locations l ON tr.location_id = l.id " +
            "WHERE tr.status = 'OPEN' AND " +
            "(6371 * acos(cos(radians(:lat)) * cos(radians(COALESCE(l.latitude, tr.latitude))) * " +
            "cos(radians(COALESCE(l.longitude, tr.longitude)) - radians(:lng)) + " +
            "sin(radians(:lat)) * sin(radians(COALESCE(l.latitude, tr.latitude))))) <= :radius " +
            "ORDER BY tr.created_at DESC", nativeQuery = true)
    List<TourRequest> findNearbyRequests(@Param("lat") double lat, 
                                        @Param("lng") double lng, 
                                        @Param("radius") double radius);
}
