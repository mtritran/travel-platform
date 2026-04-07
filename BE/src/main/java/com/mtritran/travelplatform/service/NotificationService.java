package com.mtritran.travelplatform.service;

import com.mtritran.travelplatform.dto.response.NotificationResponse;
import com.mtritran.travelplatform.entity.Notification;
import com.mtritran.travelplatform.entity.User;
import com.mtritran.travelplatform.mapper.NotificationMapper;
import com.mtritran.travelplatform.repository.NotificationRepository;
import com.mtritran.travelplatform.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NotificationService {
    SimpMessagingTemplate messagingTemplate;
    NotificationRepository notificationRepository;
    UserRepository userRepository;
    NotificationMapper notificationMapper;

    @Transactional
    public void sendNotification(String userId, String title, String message, String type) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .build();

        notificationRepository.save(notification);

        // Send to a specific topic for the user
        NotificationResponse response = notificationMapper.toResponse(notification);
        messagingTemplate.convertAndSend("/topic/user-" + userId, response);
    }

    public void broadcastNotification(String topic, Object payload) {
        // Broadcast to /topic/{topic}
        messagingTemplate.convertAndSend("/topic/" + topic, payload);
    }

    public List<NotificationResponse> getMyNotifications(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        return notificationRepository.findAllByUserOrderByCreatedAtDesc(user).stream()
                .map(notificationMapper::toResponse)
                .toList();
    }
}
