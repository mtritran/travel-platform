package com.mtritran.travelplatform.repository;

import com.mtritran.travelplatform.entity.Tour;
import com.mtritran.travelplatform.entity.TourItinerary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TourItineraryRepository extends JpaRepository<TourItinerary, String> {
    List<TourItinerary> findAllByTourOrderByStepOrderAsc(Tour tour);
    void deleteAllByTour(Tour tour);
}
