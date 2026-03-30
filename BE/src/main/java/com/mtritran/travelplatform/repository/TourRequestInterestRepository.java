package com.mtritran.travelplatform.repository;

import com.mtritran.travelplatform.entity.TourRequestInterest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TourRequestInterestRepository extends JpaRepository<TourRequestInterest, String> {
    List<TourRequestInterest> findByTourRequestIdOrderByCreatedAtAsc(String requestId);
    Optional<TourRequestInterest> findByTourRequestIdAndGuideId(String requestId, String guideId);
    boolean existsByTourRequestIdAndGuideId(String requestId, String guideId);
}
