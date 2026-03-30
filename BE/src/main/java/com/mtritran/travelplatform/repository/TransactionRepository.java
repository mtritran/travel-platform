package com.mtritran.travelplatform.repository;

import com.mtritran.travelplatform.entity.Transaction;
import com.mtritran.travelplatform.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, String> {
    List<Transaction> findAllByUserOrderByCreatedAtDesc(User user);
}
