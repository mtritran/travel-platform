package com.mtritran.travelplatform.repository;

import com.mtritran.travelplatform.entity.GuideApplication;
import com.mtritran.travelplatform.entity.User;
import com.mtritran.travelplatform.enums.ApplicationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GuideApplicationRepository extends JpaRepository<GuideApplication, String> {
    Page<GuideApplication> findAllByStatus(ApplicationStatus status, Pageable pageable);
    Optional<GuideApplication> findByUser(User user);
}
