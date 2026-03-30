package com.mtritran.travelplatform.repository;

import com.mtritran.travelplatform.entity.Booking;
import com.mtritran.travelplatform.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, String> {
    List<Booking> findAllByUser(User user);
    @org.springframework.data.jpa.repository.Query("SELECT b FROM Booking b WHERE b.user = :user ORDER BY b.createdAt DESC")
    List<Booking> findAllByUserOrderByCreatedAtDesc(@org.springframework.data.repository.query.Param("user") User user);
    // Find sessions for a guide (via Tour)
    List<Booking> findAllByTour_Guide(User guide);
    @org.springframework.data.jpa.repository.Query("SELECT b FROM Booking b WHERE b.tour.guide = :guide ORDER BY b.createdAt DESC")
    List<Booking> findAllByTour_GuideOrderByCreatedAtDesc(@org.springframework.data.repository.query.Param("guide") User guide);
    boolean existsByTour(com.mtritran.travelplatform.entity.Tour tour);

    @org.springframework.data.jpa.repository.Query("SELECT SUM(b.numberOfGuests) FROM Booking b WHERE b.tour.id = :tourId AND b.status IN :statuses AND b.bookingDate = :date AND b.startTime = :time")
    Integer sumGuestsByTourAndStatus(@org.springframework.data.repository.query.Param("tourId") String tourId, 
                                     @org.springframework.data.repository.query.Param("statuses") List<com.mtritran.travelplatform.enums.BookingStatus> statuses,
                                     @org.springframework.data.repository.query.Param("date") java.time.LocalDate date,
                                     @org.springframework.data.repository.query.Param("time") java.time.LocalTime time);

    @org.springframework.data.jpa.repository.Query("SELECT SUM(b.numberOfGuests) FROM Booking b WHERE b.tour.id = :tourId " +
           "AND (b.status IN ('CONFIRMED', 'PAID_FULL', 'COMPLETED') " +
           "OR (b.status = 'AWAITING_DEPOSIT' AND b.createdAt > :expiryTime)) " +
           "AND b.bookingDate = :date AND b.startTime = :time")
    Integer sumOccupiedSlots(@org.springframework.data.repository.query.Param("tourId") String tourId, 
                           @org.springframework.data.repository.query.Param("date") java.time.LocalDate date,
                           @org.springframework.data.repository.query.Param("time") java.time.LocalTime time,
                           @org.springframework.data.repository.query.Param("expiryTime") java.time.Instant expiryTime);
}
