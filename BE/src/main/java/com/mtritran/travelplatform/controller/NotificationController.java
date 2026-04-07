package com.mtritran.travelplatform.controller;

import com.mtritran.travelplatform.dto.response.ApiResponse;
import com.mtritran.travelplatform.dto.response.NotificationResponse;
import com.mtritran.travelplatform.entity.User;
import com.mtritran.travelplatform.repository.UserRepository;
import com.mtritran.travelplatform.service.NotificationService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NotificationController {
    NotificationService notificationService;
    UserRepository userRepository;

    @GetMapping("/my")
    public ApiResponse<List<NotificationResponse>> getMyNotifications() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));

        return ApiResponse.<List<NotificationResponse>>builder()
                .result(notificationService.getMyNotifications(user.getId()))
                .build();
    }
}
