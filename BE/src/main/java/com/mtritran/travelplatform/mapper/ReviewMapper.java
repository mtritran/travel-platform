package com.mtritran.travelplatform.mapper;

import com.mtritran.travelplatform.dto.response.ReviewResponse;
import com.mtritran.travelplatform.entity.Review;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ReviewMapper {
    @Mapping(target = "userName", source = "user.fullName")
    @Mapping(target = "userPhone", source = "user.phone")
    @Mapping(target = "tourTitle", source = "tour.title")
    ReviewResponse toResponse(Review review);
}
