package com.mtritran.travelplatform.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserUpdateRequest {
    @Email(message = "INVALID_EMAIL")
    String email;

    @Size(min = 6, max = 6, message = "Mã PIN phải có đúng 6 chữ số")
    String paymentPin;
 
    String phone;

    @Size(min = 3, message = "INVALID_FULLNAME")
    String fullName;
 
    String oldPassword;

    @Size(min = 8, message = "INVALID_PASSWORD")
    String password;

    List<String> roles;
    String biography;
    String languages;
    Integer yearsOfExperience;
    String specialties;
}
