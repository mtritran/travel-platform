package com.mtritran.travelplatform.dto.response;

import com.mtritran.travelplatform.enums.Gender;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Getter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {
    String id;
    String email;
    String phone;
    String fullName;
    Gender gender;
    LocalDate dob;
}
