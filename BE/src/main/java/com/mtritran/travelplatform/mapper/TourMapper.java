package com.mtritran.travelplatform.mapper;

import com.mtritran.travelplatform.dto.response.TourResponse;
import com.mtritran.travelplatform.entity.Tour;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TourMapper {
    @Mapping(target = "guideName", source = "guide.fullName")
    @Mapping(target = "locationName", source = "location.name")
    TourResponse toResponse(Tour tour);
}
