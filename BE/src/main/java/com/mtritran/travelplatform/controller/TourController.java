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
    @PreAuthorize("hasRole('GUIDE')")
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

    @Operation(summary = "Get tour by ID")
    @GetMapping("/{id}")
    public ApiResponse<TourResponse> getById(@PathVariable String id) {
        return ApiResponse.<TourResponse>builder()
                .result(tourService.getTourById(id))
                .build();
    }

    @Operation(summary = "Update tour", description = "Guide only.")
    @PreAuthorize("hasRole('GUIDE')")
    @PutMapping("/{id}")
    public ApiResponse<TourResponse> updateTour(@PathVariable String id, @Valid @RequestBody TourCreateRequest request) {
        return ApiResponse.<TourResponse>builder()
                .result(tourService.updateTour(id, request))
                .build();
    }

    @Operation(summary = "Guide: Get my tours")
    @PreAuthorize("hasRole('GUIDE')")
    @GetMapping("/my-tours")
    public ApiResponse<List<TourResponse>> getMyTours() {
        return ApiResponse.<List<TourResponse>>builder()
                .result(tourService.getMyTours())
                .build();
    }

    @Operation(summary = "Admin: Get all tours (paginated)")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin")
    public ApiResponse<org.springframework.data.domain.Page<TourResponse>> getAllAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        return ApiResponse.<org.springframework.data.domain.Page<TourResponse>>builder()
                .result(tourService.getAllTours(pageable))
                .build();
    }

    @Operation(summary = "Admin: Toggle tour active status")
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/toggle-status")
    public ApiResponse<TourResponse> toggleStatus(@PathVariable String id) {
        return ApiResponse.<TourResponse>builder()
                .result(tourService.toggleTourStatus(id))
                .build();
    }

    @Operation(summary = "Admin: Delete tour")
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteTour(@PathVariable String id) {
        tourService.deleteTour(id);
        return ApiResponse.<Void>builder().build();
    }
}
