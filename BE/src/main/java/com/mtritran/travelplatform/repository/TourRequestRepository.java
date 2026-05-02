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
    List<TourRequest> findAllByStatusOrderByCreatedAtDesc(TourRequestStatus status);
    List<TourRequest> findAllByUserOrderByCreatedAtDesc(com.mtritran.travelplatform.entity.User user);
    List<TourRequest> findAllByGuideOrderByCreatedAtDesc(com.mtritran.travelplatform.entity.User guide);
    
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

    /**
     * Tìm tất cả các tour yêu cầu chưa giải ngân, đã đến hạn giải ngân và không có tranh chấp.
     */
    List<TourRequest> findAllByIsPaidOutFalseAndPayoutAtBeforeAndIsDisputedFalse(java.time.Instant now);
    
    @Query("SELECT tr FROM TourRequest tr WHERE tr.isDisputed = true")
    List<TourRequest> findAllByIsDisputedTrue();

    @Query("SELECT COUNT(tr) > 0 FROM TourRequest tr " +
           "WHERE tr.user = :user AND tr.plannedDate = :date " +
           "AND tr.status IN ('ACCEPTED', 'COMPLETED') " +
           "AND tr.startTime < :endTime AND :startTime < tr.endTime")
    boolean existsOverlappingRequest(@Param("user") com.mtritran.travelplatform.entity.User user, 
                                     @Param("date") java.time.LocalDate date,
                                     @Param("startTime") java.time.LocalTime startTime,
                                     @Param("endTime") java.time.LocalTime endTime);

    @Query("SELECT COUNT(tr) > 0 FROM TourRequest tr " +
           "WHERE tr.guide = :guide AND tr.plannedDate = :date " +
           "AND tr.status IN ('ACCEPTED', 'COMPLETED') " +
           "AND tr.startTime < :endTime AND :startTime < tr.endTime")
    boolean existsOverlappingGuideRequest(@Param("guide") com.mtritran.travelplatform.entity.User guide, 
                                          @Param("date") java.time.LocalDate date,
                                          @Param("startTime") java.time.LocalTime startTime,
                                          @Param("endTime") java.time.LocalTime endTime);
}
