package com.mtritran.travelplatform.mapper;

import com.mtritran.travelplatform.dto.response.GuideApplicationResponse;
import com.mtritran.travelplatform.entity.GuideApplication;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface GuideApplicationMapper {
    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "user.fullName", target = "userFullName")
    GuideApplicationResponse toResponse(GuideApplication application);
}
