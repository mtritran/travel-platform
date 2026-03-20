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
    @Mapping(target = "pickupLocationName", source = "pickupLocation.name")
    @Mapping(target = "pickupLocationAddress", source = "pickupLocation.address")
    @Mapping(target = "pickupLatitude", source = "pickupLocation.latitude")
    @Mapping(target = "pickupLongitude", source = "pickupLocation.longitude")
    @Mapping(target = "depositPercentage", source = "tour.depositPercentage")
    @Mapping(target = "tourStartDate", source = "tour.startDate")
    @Mapping(target = "tourStartTime", source = "tour.startTime")
    BookingResponse toResponse(Booking booking);
}
