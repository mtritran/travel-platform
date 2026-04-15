package com.mtritran.travelplatform.repository;

import com.mtritran.travelplatform.entity.GuideApplication;
import com.mtritran.travelplatform.entity.User;
import com.mtritran.travelplatform.enums.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GuideApplicationRepository extends JpaRepository<GuideApplication, String> {
    List<GuideApplication> findAllByStatus(ApplicationStatus status);
    Optional<GuideApplication> findByUser(User user);
}
