package com.mtritran.travelplatform.mapper;

import com.mtritran.travelplatform.dto.request.UserCreateRequest;
import com.mtritran.travelplatform.dto.request.UserUpdateRequest;
import com.mtritran.travelplatform.dto.response.UserResponse;
import com.mtritran.travelplatform.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface UserMapper {
    User toUser(UserCreateRequest request);

    @org.mapstruct.Mapping(target = "roles", ignore = true)
    @org.mapstruct.Mapping(target = "password", ignore = true)
    void updateUser(@MappingTarget User user, UserUpdateRequest request);

    @org.mapstruct.Mapping(target = "hasPaymentPin", expression = "java(user.getPaymentPin() != null)")
    UserResponse toResponse(User user);
}
