package com.mtritran.travelplatform.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserUpdateRequest {
    @Email(message = "INVALID_EMAIL")
    String email;

    String phone;

    @Size(min = 3, message = "INVALID_FULLNAME")
    String fullName;

    @Size(min = 8, message = "INVALID_PASSWORD")
    String password;
}
