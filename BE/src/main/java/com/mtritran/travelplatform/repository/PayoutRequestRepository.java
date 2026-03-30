package com.mtritran.travelplatform.repository;

import com.mtritran.travelplatform.entity.PayoutRequest;
import com.mtritran.travelplatform.entity.User;
import com.mtritran.travelplatform.enums.PayoutStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PayoutRequestRepository extends JpaRepository<PayoutRequest, String> {
    List<PayoutRequest> findAllByUserOrderByCreatedAtDesc(User user);
    List<PayoutRequest> findAllByStatusOrderByCreatedAtDesc(PayoutStatus status);
}
