package com.mtritran.travelplatform.mapper;

import com.mtritran.travelplatform.dto.response.BookingResponse;
import com.mtritran.travelplatform.entity.Booking;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface BookingMapper {
    @Mapping(target = "userName", source = "user.fullName")
    @Mapping(target = "tourTitle", source = "tour.title")
    @Mapping(target = "guideName", source = "tour.guide.fullName")
    BookingResponse toResponse(Booking booking);
}
