package com.mtritran.travelplatform.controller;

import com.mtritran.travelplatform.dto.request.UserCreateRequest;
import com.mtritran.travelplatform.dto.request.UserUpdateRequest;
import com.mtritran.travelplatform.dto.response.UserResponse;
import com.mtritran.travelplatform.service.UserService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "User", description = "APIs for managing users")
public class UserController {
    UserService userService;

    @PostMapping("/register")
    public ResponseEntity<UserResponse> createUser(@RequestBody UserCreateRequest request) {
        UserResponse response = userService.createUser(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<UserResponse> getUserById(@PathVariable String id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<UserResponse> updateUserById(@PathVariable String id, @RequestBody UserUpdateRequest request) {
        return ResponseEntity.ok(userService.updateUserById(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable String id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
