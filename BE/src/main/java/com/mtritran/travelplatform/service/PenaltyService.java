package com.mtritran.travelplatform.service;

import com.mtritran.travelplatform.entity.User;
import com.mtritran.travelplatform.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PenaltyService {
    UserRepository userRepository;
    NotificationService notificationService;

    /**
     * Cộng điểm phạt cho người dùng (HDV). 
     * Nếu đạt >= 5 điểm, tự động khóa tính năng Guide trong 1 tháng.
     */
    @Transactional
    public void addPenalty(String userId, int points, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        int currentPoints = user.getPenaltyPoints() != null ? user.getPenaltyPoints() : 0;
        int newPoints = currentPoints + points;
        user.setPenaltyPoints(newPoints);

        String message = "Bạn vừa bị cộng " + points + " điểm phạt. Lý do: " + reason + ". Tổng điểm hiện tại: " + newPoints;
        
        if (newPoints >= 5) {
            // Ban guide for 30 days
            Instant banUntil = Instant.now().plus(30, ChronoUnit.DAYS);
            user.setGuideBannedUntil(banUntil);
            user.setPenaltyPoints(0); // Reset points after banning? Or keep? User said "5 điểm sẽ bị khóa"
            
            message += ". Bạn đã đạt ngưỡng 5 điểm phạt và bị tạm khóa chức năng Hướng dẫn viên đến: " + banUntil.toString();
            
            notificationService.sendNotification(userId, "Tài khoản bị tạm khóa", message, "ACCOUNT_BANNED");
        } else {
            notificationService.sendNotification(userId, "Cảnh báo điểm phạt", message, "PENALTY_ADDED");
        }

        userRepository.save(user);
    }
}
