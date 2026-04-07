package com.mtritran.travelplatform.controller;
 
import com.mtritran.travelplatform.dto.response.ApiResponse;
import com.mtritran.travelplatform.service.OtpService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;
 
@RestController
@RequestMapping("/otp")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "OTP", description = "APIs for One-Time Password management")
public class OtpController {
    OtpService otpService;
 
    @Operation(summary = "Send OTP to Email", description = "Generate and send a 6-digit code for verification.")
    @PostMapping("/send")
    public ApiResponse<String> sendOtp(@RequestParam String email) {
        otpService.generateAndSendOtp(email);
        return ApiResponse.<String>builder()
                .result("Mã xác thực đã được gửi thành công. Vui lòng kiểm tra email của bạn.")
                .build();
    }
}
