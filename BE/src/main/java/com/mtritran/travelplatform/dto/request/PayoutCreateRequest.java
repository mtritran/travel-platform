package com.mtritran.travelplatform.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PayoutCreateRequest {
    @NotNull(message = "Số tiền không được để trống")
    @DecimalMin(value = "50000.0", message = "Số tiền tối thiểu là 50,000 VND")
    BigDecimal amount;

    @NotBlank(message = "Tên ngân hàng không được để trống")
    String bankName;

    @NotBlank(message = "Số tài khoản không được để trống")
    String bankAccountNumber;

    @NotBlank(message = "Tên chủ tài khoản không được để trống")
    String bankAccountName;
}
