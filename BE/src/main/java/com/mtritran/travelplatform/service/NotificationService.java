package com.mtritran.travelplatform.service;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NotificationService {
    SimpMessagingTemplate messagingTemplate;

    public void sendNotification(String userId, Object payload) {
        // More reliable way: Send to a specific topic for the user
        messagingTemplate.convertAndSend("/topic/user-" + userId, payload);
    }

    public void broadcastNotification(String topic, Object payload) {
        // Broadcast to /topic/{topic}
        messagingTemplate.convertAndSend("/topic/" + topic, payload);
    }
}
