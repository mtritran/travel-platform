package com.mtritran.travelplatform.dto.response;

import com.mtritran.travelplatform.enums.Gender;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Set;

@Getter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {
    String id;
    String email;
    String phone;
    boolean hasPaymentPin;
    String fullName;
    Gender gender;
    LocalDate dob;
    Set<RoleResponse> roles;
    BigDecimal balance;
    String biography;
    String languages;
    Integer yearsOfExperience;
    String specialties;
    String avatarUrl;
    String operatingAreas;
    Double currentLat;
    Double currentLong;
    String currentAddress;
    Instant lastLocationUpdate;
}
