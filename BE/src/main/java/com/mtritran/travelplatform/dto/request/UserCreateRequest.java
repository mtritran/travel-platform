package com.mtritran.travelplatform.dto.request;

import com.mtritran.travelplatform.enums.Gender;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserCreateRequest {
    String email;
    String phone;
    String fullName;
    Gender gender;
    LocalDate dob;
    String password;
}
