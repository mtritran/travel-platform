package com.mtritran.travelplatform.repository;
 
import com.mtritran.travelplatform.entity.Otp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
 
import java.util.Optional;
 
@Repository
public interface OtpRepository extends JpaRepository<Otp, String> {
    Optional<Otp> findTopByEmailOrderByCreatedAtDesc(String email);
    void deleteAllByEmail(String email);
}
