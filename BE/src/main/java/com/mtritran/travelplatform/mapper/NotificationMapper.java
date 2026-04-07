package com.mtritran.travelplatform.mapper;

import com.mtritran.travelplatform.dto.response.NotificationResponse;
import com.mtritran.travelplatform.entity.Notification;
import org.mapstruct.Mapper;

import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface NotificationMapper {
    @Mapping(target = "isRead", source = "read")
    NotificationResponse toResponse(Notification notification);
}
