package com.mtritran.travelplatform.controller;

import com.mtritran.travelplatform.dto.response.ApiResponse;
import com.mtritran.travelplatform.dto.request.ReviewCreateRequest;
import com.mtritran.travelplatform.dto.response.ReviewResponse;
import com.mtritran.travelplatform.service.ReviewService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ReviewController {
    ReviewService reviewService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<ReviewResponse> createReview(
            @RequestPart("request") @Valid ReviewCreateRequest request,
            @RequestPart(value = "files", required = false) List<MultipartFile> files) {
        return ApiResponse.<ReviewResponse>builder()
                .result(reviewService.createReview(request, files))
                .build();
    }

    @GetMapping("/tour/{tourId}")
    public ApiResponse<List<ReviewResponse>> getReviewsByTour(@PathVariable String tourId) {
        return ApiResponse.<List<ReviewResponse>>builder()
                .result(reviewService.getReviewsByTour(tourId))
                .build();
    }

    @GetMapping("/guide/{guideId}")
    public ApiResponse<List<ReviewResponse>> getReviewsByGuide(@PathVariable String guideId) {
        return ApiResponse.<List<ReviewResponse>>builder()
                .result(reviewService.getReviewsByGuide(guideId))
                .build();
    }

    // Admin endpoints
    @GetMapping("/admin")
    public ApiResponse<List<ReviewResponse>> getAllReviewsForAdmin() {
        return ApiResponse.<List<ReviewResponse>>builder()
                .result(reviewService.getAllReviewsForAdmin())
                .build();
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<Void> updateReviewStatus(
            @PathVariable String id,
            @RequestParam boolean active) {
        reviewService.updateReviewStatus(id, active);
        return ApiResponse.<Void>builder().build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteReview(@PathVariable String id) {
        reviewService.deleteReview(id);
        return ApiResponse.<Void>builder().build();
    }
}
