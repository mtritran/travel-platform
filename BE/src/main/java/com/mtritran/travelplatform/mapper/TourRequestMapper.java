package com.mtritran.travelplatform.mapper;

import com.mtritran.travelplatform.dto.response.TourRequestResponse;
import com.mtritran.travelplatform.entity.TourRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TourRequestMapper {
    @Mapping(target = "userName", source = "user.fullName")
    @Mapping(target = "locationName", source = "location.name")
    @Mapping(target = "guideName", source = "guide.fullName")
    @Mapping(target = "customerAvatarUrl", source = "user.avatarUrl")
    TourRequestResponse toResponse(TourRequest request);
}
