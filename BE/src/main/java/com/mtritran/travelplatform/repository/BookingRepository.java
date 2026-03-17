package com.mtritran.travelplatform.repository;

import com.mtritran.travelplatform.entity.Booking;
import com.mtritran.travelplatform.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, String> {
    List<Booking> findAllByUser(User user);
    // Find sessions for a guide (via Tour)
    List<Booking> findAllByTour_Guide(User guide);
}
