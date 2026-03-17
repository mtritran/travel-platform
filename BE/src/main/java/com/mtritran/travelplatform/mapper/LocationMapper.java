package com.mtritran.travelplatform.mapper;

import com.mtritran.travelplatform.dto.response.LocationResponse;
import com.mtritran.travelplatform.entity.Location;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface LocationMapper {
    LocationResponse toResponse(Location location);
}
