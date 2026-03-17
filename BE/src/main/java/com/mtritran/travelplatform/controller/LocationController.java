package com.mtritran.travelplatform.controller;

import com.mtritran.travelplatform.dto.response.ApiResponse;
import com.mtritran.travelplatform.dto.response.LocationResponse;
import com.mtritran.travelplatform.service.LocationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
