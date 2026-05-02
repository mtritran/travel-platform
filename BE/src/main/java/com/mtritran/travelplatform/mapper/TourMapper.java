package com.mtritran.travelplatform.mapper;

import com.mtritran.travelplatform.dto.response.TourResponse;
import com.mtritran.travelplatform.entity.Tour;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TourMapper {
    @Mapping(target = "guideId", source = "guide.id")
    @Mapping(target = "guideName", source = "guide.fullName")
    @Mapping(target = "locationName", source = "location.name")
    @Mapping(target = "locationAddress", source = "location.address")
    @Mapping(target = "latitude", source = "location.latitude")
    @Mapping(target = "longitude", source = "location.longitude")
    @Mapping(target = "meetingLocationName", source = "meetingLocation.name")
    @Mapping(target = "meetingLocationAddress", source = "meetingLocation.address")
    @Mapping(target = "meetingLatitude", source = "meetingLocation.latitude")
    @Mapping(target = "meetingLongitude", source = "meetingLocation.longitude")
    @Mapping(target = "guideAvatarUrl", source = "guide.avatarUrl")
    TourResponse toResponse(Tour tour);
}
