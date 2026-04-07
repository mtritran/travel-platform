package com.mtritran.travelplatform.dto.request;

import com.mtritran.travelplatform.enums.Gender;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
    @Email(message = "INVALID_EMAIL")
    @NotBlank(message = "INVALID_EMAIL")
    String email;

    @NotBlank(message = "Mã xác thực OTP không được để trống")
    String otpCode;

    @NotBlank(message = "EMPTY_FULLNAME")
    @Size(min = 3, message = "INVALID_FULLNAME")
    String fullName;

    Gender gender;
    LocalDate dob;

    @Size(min = 8, message = "INVALID_PASSWORD")
    String password;
}
