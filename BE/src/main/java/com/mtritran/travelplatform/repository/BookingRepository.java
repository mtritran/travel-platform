package com.mtritran.travelplatform.repository;

import com.mtritran.travelplatform.entity.Booking;
import com.mtritran.travelplatform.entity.Tour;
import com.mtritran.travelplatform.entity.User;
import com.mtritran.travelplatform.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, String> {
    List<Booking> findAllByUser(User user);

    @Query("SELECT b FROM Booking b WHERE b.tour.id = :tourId AND b.bookingDate = :date AND b.status NOT IN ('CANCELLED', 'COMPLETED')")
    List<Booking> findAllActiveByTourAndDate(@Param("tourId") String tourId, @Param("date") LocalDate date);
    
    @Query("SELECT b FROM Booking b WHERE b.user = :user ORDER BY b.createdAt DESC")
    List<Booking> findAllByUserOrderByCreatedAtDesc(@Param("user") User user);

    List<Booking> findAllByUser_EmailOrderByCreatedAtDesc(String email);
    
    // Find sessions for a guide (via Tour)
    List<Booking> findAllByTour_Guide(User guide);
    
    @Query("SELECT b FROM Booking b WHERE b.tour.guide = :guide ORDER BY b.createdAt DESC")
    List<Booking> findAllByTour_GuideOrderByCreatedAtDesc(@Param("guide") User guide);
    
    boolean existsByTour(Tour tour);

    @Query("SELECT SUM(b.numberOfGuests) FROM Booking b WHERE b.tour.id = :tourId AND b.status IN :statuses AND b.bookingDate = :date AND b.startTime = :time")
    Integer sumGuestsByTourAndStatus(@Param("tourId") String tourId, 
                                     @Param("statuses") List<BookingStatus> statuses,
                                     @Param("date") LocalDate date,
                                     @Param("time") LocalTime time);

    @Query("SELECT SUM(b.numberOfGuests) FROM Booking b WHERE b.tour.id = :tourId " +
           "AND (b.status IN ('CONFIRMED', 'PAID_FULL') " +
           "OR (b.status = 'AWAITING_DEPOSIT' AND b.createdAt > :expiryTime)) " +
           "AND b.bookingDate = :date AND b.startTime = :time")
    Integer sumOccupiedSlots(@Param("tourId") String tourId, 
                           @Param("date") LocalDate date,
                           @Param("time") LocalTime time,
                           @Param("expiryTime") Instant expiryTime);

    /**
     * Trả về true nếu customer đã có booking active (chưa huỷ, chưa hoàn thành)
     * trên cùng một tour này — dùng để chặn đặt lại khi đang trong tour.
     */
    @Query(
        "SELECT COUNT(b) > 0 FROM Booking b " +
        "WHERE b.user = :user AND b.tour.id = :tourId " +
        "AND b.status IN ('AWAITING_DEPOSIT', 'CONFIRMED', 'PAID_FULL')")
    boolean hasActiveBookingForTour(
        @Param("user") User user,
        @Param("tourId") String tourId);

    @Query(
        "SELECT COUNT(b) FROM Booking b " +
        "WHERE b.tour.id = :tourId " +
        "AND (b.status IN ('CONFIRMED', 'PAID_FULL') " +
        "OR (b.status = 'AWAITING_DEPOSIT' AND b.createdAt > :expiryThreshold))")
    long countActiveBookings(
        @Param("tourId") String tourId,
        @Param("expiryThreshold") Instant expiryThreshold);

    /**
     * Tìm tất cả các booking chưa giải ngân, đã đến hạn giải ngân và không có tranh chấp.
     */
    List<Booking> findAllByIsPaidOutFalseAndPayoutAtBeforeAndIsDisputedFalse(Instant now);

    @Query("SELECT b FROM Booking b WHERE b.isDisputed = true")
    List<Booking> findAllByIsDisputedTrue();

    @Query("SELECT COUNT(b) > 0 FROM Booking b " +
           "WHERE b.user = :user AND b.bookingDate = :date " +
           "AND b.status IN ('CONFIRMED', 'PAID_FULL', 'AWAITING_DEPOSIT') " +
           "AND b.tour.startTime < :endTime AND :startTime < b.tour.endTime")
    boolean existsOverlappingBooking(@Param("user") User user, 
                                     @Param("date") LocalDate date,
                                     @Param("startTime") LocalTime startTime,
                                     @Param("endTime") LocalTime endTime);

    @Query("SELECT COUNT(b) > 0 FROM Booking b " +
           "WHERE b.tour.guide = :guide AND b.bookingDate = :date " +
           "AND b.status IN ('CONFIRMED', 'PAID_FULL', 'AWAITING_DEPOSIT') " +
           "AND b.tour.startTime < :endTime AND :startTime < b.tour.endTime")
    boolean existsOverlappingGuideBooking(@Param("guide") User guide, 
                                          @Param("date") LocalDate date,
                                          @Param("startTime") LocalTime startTime,
                                          @Param("endTime") LocalTime endTime);
}
