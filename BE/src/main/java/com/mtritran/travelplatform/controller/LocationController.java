package com.mtritran.travelplatform.controller;

import com.mtritran.travelplatform.dto.request.LocationCreateRequest;
import com.mtritran.travelplatform.dto.response.ApiResponse;
import com.mtritran.travelplatform.dto.response.LocationResponse;
import com.mtritran.travelplatform.service.LocationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/locations")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "Location", description = "APIs for locations management")
public class LocationController {
    LocationService locationService;

    @Operation(summary = "Get all locations", description = "Public access to browse destinations.")
    @GetMapping
    public ApiResponse<List<LocationResponse>> getAll() {
        return ApiResponse.<List<LocationResponse>>builder()
                .result(locationService.getAllLocations())
                .build();
    }

    @Operation(summary = "Admin/Guide: Create new location")
    @PreAuthorize("hasRole('ADMIN') or hasRole('GUIDE')")
    @PostMapping
    public ApiResponse<LocationResponse> create(@RequestBody LocationCreateRequest request) {
        return ApiResponse.<LocationResponse>builder()
                .result(locationService.createLocation(request))
                .build();
    }

    @Operation(summary = "Admin: Update location")
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ApiResponse<LocationResponse> update(@PathVariable String id, @RequestBody LocationCreateRequest request) {
        return ApiResponse.<LocationResponse>builder()
                .result(locationService.updateLocation(id, request))
                .build();
    }

    @Operation(summary = "Admin: Delete location")
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable String id) {
        locationService.deleteLocation(id);
        return ApiResponse.<Void>builder().build();
    }
}
