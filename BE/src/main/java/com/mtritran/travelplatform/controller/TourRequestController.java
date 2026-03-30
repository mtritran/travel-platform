package com.mtritran.travelplatform.controller;

import com.mtritran.travelplatform.dto.request.TourRequestCreateRequest;
import com.mtritran.travelplatform.dto.response.ApiResponse;
import com.mtritran.travelplatform.dto.response.TourRequestResponse;
import com.mtritran.travelplatform.service.TourRequestService;
import com.mtritran.travelplatform.service.ai.GuideRecommendationService;
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
    GuideRecommendationService guideRecommendationService;

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

    @Operation(summary = "Get my tour requests", description = "Customer gets their own tour requests.")
    @GetMapping("/me")
    public ApiResponse<List<TourRequestResponse>> getMyRequests() {
        return ApiResponse.<List<TourRequestResponse>>builder()
                .result(tourRequestService.getMyRequests())
                .build();
    }

    @Operation(summary = "Get accepted tour requests", description = "Guide gets tour requests they have accepted.")
    @PreAuthorize("hasRole('GUIDE')")
    @GetMapping("/accepted")
    public ApiResponse<List<TourRequestResponse>> getAcceptedRequests() {
        return ApiResponse.<List<TourRequestResponse>>builder()
                .result(tourRequestService.getAcceptedRequests())
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

    @Operation(summary = "Express interest", description = "Guide shows interest in a tour request.")
    @PreAuthorize("hasRole('GUIDE')")
    @PostMapping("/{id}/interest")
    public ApiResponse<TourRequestResponse> addInterest(@PathVariable String id,
            @RequestParam(required = false) String message) {
        return ApiResponse.<TourRequestResponse>builder()
                .result(tourRequestService.addInterest(id, message))
                .build();
    }

    @Operation(summary = "Select guide for request", description = "Customer selects a guide from interest list.")
    @PostMapping("/{id}/select-guide")
    public ApiResponse<TourRequestResponse> selectGuide(@PathVariable String id, @RequestParam String guideId) {
        return ApiResponse.<TourRequestResponse>builder()
                .result(tourRequestService.selectGuide(id, guideId))
                .build();
    }

    @Operation(summary = "Confirm matching", description = "Guide confirms they will take the tour.")
    @PreAuthorize("hasRole('GUIDE')")
    @PostMapping("/{id}/confirm-match")
    public ApiResponse<TourRequestResponse> confirm(@PathVariable String id) {
        return ApiResponse.<TourRequestResponse>builder()
                .result(tourRequestService.confirmMatch(id))
                .build();
    }

    @Operation(summary = "Decline matching", description = "Guide declines the matching.")
    @PreAuthorize("hasRole('GUIDE')")
    @PostMapping("/{id}/decline-match")
    public ApiResponse<TourRequestResponse> decline(@PathVariable String id) {
        return ApiResponse.<TourRequestResponse>builder()
                .result(tourRequestService.declineMatch(id))
                .build();
    }

    @Operation(summary = "Cancel matching", description = "Customer cancels the matching.")
    @PostMapping("/{id}/cancel-match")
    public ApiResponse<TourRequestResponse> cancelMatch(@PathVariable String id) {
        return ApiResponse.<TourRequestResponse>builder()
                .result(tourRequestService.cancelMatch(id))
                .build();
    }

    @Operation(summary = "Update tour request", description = "Customer updates their tour request. Only allowed if status is OPEN.")
    @PutMapping("/{id}")
    public ApiResponse<TourRequestResponse> updateRequest(@PathVariable String id,
            @Valid @RequestBody TourRequestCreateRequest request) {
        return ApiResponse.<TourRequestResponse>builder()
                .result(tourRequestService.updateRequest(id, request))
                .build();
    }

    @Operation(summary = "Delete tour request", description = "Customer deletes their tour request.")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteRequest(@PathVariable String id) {
        tourRequestService.deleteRequest(id);
        return ApiResponse.<Void>builder().build();
    }

    @Operation(summary = "Pay deposit for tour request", description = "Customer pays deposit after guide confirmation.")
    @PostMapping("/{id}/pay-deposit")
    public ApiResponse<TourRequestResponse> payDeposit(@PathVariable String id) {
        return ApiResponse.<TourRequestResponse>builder()
                .result(tourRequestService.payDeposit(id))
                .build();
    }

    @Operation(summary = "Pay remaining balance for tour request")
    @PostMapping("/{id}/pay-remaining")
    public ApiResponse<TourRequestResponse> payRemaining(@PathVariable String id) {
        return ApiResponse.<TourRequestResponse>builder()
                .result(tourRequestService.payRemaining(id))
                .build();
    }

    @Operation(summary = "Complete tour request", description = "Guide marks tour as completed.")
    @PreAuthorize("hasRole('GUIDE')")
    @PostMapping("/{id}/complete-tour")
    public ApiResponse<TourRequestResponse> completeTour(@PathVariable String id) {
        return ApiResponse.<TourRequestResponse>builder()
                .result(tourRequestService.completeTour(id))
                .build();
    }

    @Operation(summary = "Get AI recommendations for guides", description = "Uses RAG to recommend the best guides for this request.")
    @GetMapping("/{id}/ai-recommendations")
    public ApiResponse<String> getAiRecommendations(@PathVariable String id) {
        return ApiResponse.<String>builder()
                .result(guideRecommendationService.getRecommendation(id))
                .build();
    }

    @Operation(summary = "Admin: Index all guides into vector DB", description = "One-time setup or refresh of AI knowledge base.")
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/ai-index-guides")
    public ApiResponse<String> indexGuides() {
        guideRecommendationService.indexAllGuides();
        return ApiResponse.<String>builder()
                .result("Đang bắt đầu đồng bộ hóa dữ liệu HDV vào Vector Database...")
                .build();
    }
}
