package com.mtritran.travelplatform.controller;

import com.mtritran.travelplatform.dto.request.UserCreateRequest;
import com.mtritran.travelplatform.dto.request.UserUpdateRequest;
import com.mtritran.travelplatform.dto.response.ApiResponse;
import com.mtritran.travelplatform.dto.response.UserResponse;
import com.mtritran.travelplatform.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "User", description = "APIs for managing users")
public class UserController {
    UserService userService;

    @Operation(summary = "Registry new user")
    @PostMapping("/register")
    public ApiResponse<UserResponse> createUser(@Valid @RequestBody UserCreateRequest request) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.createUser(request))
                .build();
    }

    @Operation(summary = "Get all users", description = "Admin only")
    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<org.springframework.data.domain.Page<UserResponse>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        return ApiResponse.<org.springframework.data.domain.Page<UserResponse>>builder()
                .result(userService.getAllUsers(pageable))
                .build();
    }

    @Operation(summary = "Get user by ID", description = "Admin only")
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<UserResponse> getUserById(@PathVariable String id) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.getUserById(id))
                .build();
    }

    @Operation(summary = "Update user by ID", description = "Admin only")
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<UserResponse> updateUserById(@PathVariable String id, @Valid @RequestBody UserUpdateRequest request) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.updateUserById(id, request))
                .build();
    }

    @Operation(summary = "Delete user by ID", description = "Admin only")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<Void> deleteUser(@PathVariable String id) {
        userService.deleteUser(id);
        return ApiResponse.<Void>builder().build();
    }

    @Operation(summary = "Get my profile info")
    @GetMapping("/my-info")
    public ApiResponse<UserResponse> getMyInfo() {
        return ApiResponse.<UserResponse>builder()
                .result(userService.getMyInfo())
                .build();
    }
}
