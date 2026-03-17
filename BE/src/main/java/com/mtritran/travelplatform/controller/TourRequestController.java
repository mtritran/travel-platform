package com.mtritran.travelplatform.controller;

import com.mtritran.travelplatform.dto.request.TourRequestCreateRequest;
import com.mtritran.travelplatform.dto.response.ApiResponse;
import com.mtritran.travelplatform.dto.response.TourRequestResponse;
import com.mtritran.travelplatform.service.TourRequestService;
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
@RequestMapping("/tour-requests")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "Tour Request", description = "APIs for user tour requests management")
public class TourRequestController {
    TourRequestService tourRequestService;

    @Operation(summary = "Create tour request", description = "User posts a request searching for a guide.")
    @PostMapping
    public ApiResponse<TourRequestResponse> createRequest(@Valid @RequestBody TourRequestCreateRequest request) {
        return ApiResponse.<TourRequestResponse>builder()
                .result(tourRequestService.createRequest(request))
                .build();
    }

    @Operation(summary = "Get all open requests", description = "List all tour requests that are still OPEN.")
    @GetMapping
    public ApiResponse<List<TourRequestResponse>> getAll() {
        return ApiResponse.<List<TourRequestResponse>>builder()
                .result(tourRequestService.getAllOpenRequests())
                .build();
    }

    @Operation(summary = "Find nearby requests", description = "Guide finds tour requests within radius (km) from current GPS location.")
    @GetMapping("/nearby")
    public ApiResponse<List<TourRequestResponse>> getNearby(
            @RequestParam double lat, 
            @RequestParam double lng, 
            @RequestParam(defaultValue = "20.0") double radius) {
        return ApiResponse.<List<TourRequestResponse>>builder()
                .result(tourRequestService.getNearbyRequests(lat, lng, radius))
                .build();
    }

    @Operation(summary = "Accept a tour request", description = "Guide accepts a user's tour request.")
    @PreAuthorize("hasAuthority('GUIDE')")
    @PostMapping("/{id}/accept")
    public ApiResponse<TourRequestResponse> accept(@PathVariable String id) {
        return ApiResponse.<TourRequestResponse>builder()
                .result(tourRequestService.acceptRequest(id))
                .build();
    }
}
