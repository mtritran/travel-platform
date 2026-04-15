package com.mtritran.travelplatform.controller;

import com.mtritran.travelplatform.dto.request.*;
import com.mtritran.travelplatform.dto.response.ApiResponse;
import com.mtritran.travelplatform.dto.response.AuthenticationResponse;
import com.mtritran.travelplatform.dto.response.IntrospectResponse;
import com.mtritran.travelplatform.service.AuthenticationService;
import com.nimbusds.jose.JOSEException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.text.ParseException;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "Authentication", description = "APIs for authentication")
public class AuthenticationController {
    AuthenticationService authenticationService;

    @Operation(summary = "Authenticate user and generate token")
    @PostMapping("/login")
    public ApiResponse<AuthenticationResponse> authenticate(@RequestBody AuthenticationRequest request) {
        return ApiResponse.<AuthenticationResponse>builder()
                .result(authenticationService.authenticate(request))
                .build();
    }

    @Operation(summary = "Introspect token to check its validity")
    @PostMapping("/introspect")
    public ApiResponse<IntrospectResponse> introspect(@RequestBody IntrospectRequest request) throws ParseException, JOSEException {
        return ApiResponse.<IntrospectResponse>builder()
                .result(authenticationService.introspect(request))
                .build();
    }

    @Operation(summary = "Refresh expired token")
    @PostMapping("/refresh")
    public ApiResponse<AuthenticationResponse> refreshToken(@RequestBody RefreshRequest request) throws ParseException, JOSEException {
        return ApiResponse.<AuthenticationResponse>builder()
                .result(authenticationService.refreshToken(request))
                .build();
    }

    @Operation(summary = "Logout user and invalidate token")
    @PostMapping("/logout")
    public void logout(@RequestBody RefreshRequest request) throws ParseException, JOSEException {
        authenticationService.logout(request);
    }

    @Operation(summary = "Request a password reset OTP")
    @PostMapping("/forgot-password")
    public ApiResponse<Void> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        authenticationService.forgotPassword(request);
        return ApiResponse.<Void>builder()
                .message("Mã OTP đã được gửi đến email của bạn.")
                .build();
    }

    @Operation(summary = "Reset password using OTP")
    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(@RequestBody ResetPasswordRequest request) {
        authenticationService.resetPassword(request);
        return ApiResponse.<Void>builder()
                .message("Đổi mật khẩu thành công.")
                .build();
    }
}
