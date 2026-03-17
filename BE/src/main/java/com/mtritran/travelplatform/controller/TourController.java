package com.mtritran.travelplatform.controller;

import com.mtritran.travelplatform.dto.request.TourCreateRequest;
import com.mtritran.travelplatform.dto.response.ApiResponse;
import com.mtritran.travelplatform.dto.response.TourResponse;
import com.mtritran.travelplatform.service.TourService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tours")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "Tour", description = "APIs for tours management")
public class TourController {
    TourService tourService;

    @Operation(summary = "Create new tour", description = "Guide only. Connect tour with a predefined location.")
    @PreAuthorize("hasAuthority('GUIDE')")
    @PostMapping
    public ApiResponse<TourResponse> createTour(@Valid @RequestBody TourCreateRequest request) {
        return ApiResponse.<TourResponse>builder()
                .result(tourService.createTour(request))
                .build();
    }

    @Operation(summary = "Get all active tours", description = "Public access to browse tours.")
    @GetMapping
    public ApiResponse<List<TourResponse>> getAll() {
        return ApiResponse.<List<TourResponse>>builder()
                .result(tourService.getAllActiveTours())
                .build();
    }

    @Operation(summary = "Find nearby tours", description = "Find active tours within radius (km) from current GPS location.")
    @GetMapping("/nearby")
    public ApiResponse<List<TourResponse>> getNearby(
            @RequestParam double lat, 
            @RequestParam double lng, 
            @RequestParam(defaultValue = "20.0") double radius) {
        return ApiResponse.<List<TourResponse>>builder()
                .result(tourService.getNearbyTours(lat, lng, radius))
                .build();
    }
}
