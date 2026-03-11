package com.mtritran.travelplatform.controller;

import com.mtritran.travelplatform.dto.request.AuthenticationRequest;
import com.mtritran.travelplatform.dto.request.IntrospectRequest;
import com.mtritran.travelplatform.dto.request.RefreshRequest;
import com.mtritran.travelplatform.dto.response.AuthenticationResponse;
import com.mtritran.travelplatform.dto.response.IntrospectResponse;
import com.mtritran.travelplatform.service.AuthenticationService;
import com.nimbusds.jose.JOSEException;
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

    @PostMapping("/login")
    public AuthenticationResponse authenticate(@RequestBody AuthenticationRequest request) {
        return authenticationService.authenticate(request);
    }

    @PostMapping("/introspect")
    public IntrospectResponse introspect(@RequestBody IntrospectRequest request) throws ParseException, JOSEException {
        return authenticationService.introspect(request);
    }

    @PostMapping("/refresh")
    public AuthenticationResponse refreshToken(@RequestBody RefreshRequest request) throws ParseException, JOSEException {
        return authenticationService.refreshToken(request);
    }

    @PostMapping("/logout")
    public void logout(@RequestBody RefreshRequest request) throws ParseException, JOSEException {
        authenticationService.logout(request);
    }
}
