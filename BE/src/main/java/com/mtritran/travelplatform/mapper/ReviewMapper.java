package com.mtritran.travelplatform.mapper;

import com.mtritran.travelplatform.dto.response.ReviewResponse;
import com.mtritran.travelplatform.entity.Review;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring")
public interface ReviewMapper {
    @Mapping(target = "userName", source = "user.fullName")
    @Mapping(target = "userPhone", source = "user.phone")
    @Mapping(target = "userAvatarUrl", source = "user.avatarUrl")
    @Mapping(target = "tourId", source = "tour.id")
    @Mapping(target = "tourRequestId", source = "tourRequest.id")
    @Mapping(target = "tourTitle", source = "review", qualifiedByName = "mapTourTitle")
    ReviewResponse toResponse(Review review);

    @Named("mapTourTitle")
    default String mapTourTitle(Review review) {
        if (review == null) return null;
        if (review.getTour() != null) return review.getTour().getTitle();
        if (review.getTourRequest() != null) return review.getTourRequest().getTitle();
        return null;
    }
}
