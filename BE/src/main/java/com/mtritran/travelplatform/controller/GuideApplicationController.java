package com.mtritran.travelplatform.controller;

import com.mtritran.travelplatform.dto.request.GuideApplicationRequest;
import com.mtritran.travelplatform.dto.response.ApiResponse;
import com.mtritran.travelplatform.dto.response.GuideApplicationResponse;
import com.mtritran.travelplatform.enums.ApplicationStatus;
import com.mtritran.travelplatform.enums.InterviewStatus;
import com.mtritran.travelplatform.service.GuideApplicationService;
import com.mtritran.travelplatform.service.StorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/guide-applications")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "Guide Application", description = "APIs for managing guide applications")
public class GuideApplicationController {

    GuideApplicationService applicationService;
    StorageService storageService;

    @Operation(summary = "Apply for a guide role", description = "Upload 7 required documents and competency info.")
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<GuideApplicationResponse> apply(@ModelAttribute GuideApplicationRequest request) {
        return ApiResponse.<GuideApplicationResponse>builder()
                .result(applicationService.createApplication(request))
                .build();
    }

    @Operation(summary = "Get my guide application", description = "Get current user's guide application.")
    @GetMapping("/my-application")
    public ApiResponse<GuideApplicationResponse> getMyApplication() {
        return ApiResponse.<GuideApplicationResponse>builder()
                .result(applicationService.getMyApplication())
                .build();
    }

    @Operation(summary = "Update my guide application", description = "Update current user's guide application files. Used for resubmitting or adding info.")
    @PutMapping(value = "/my-application", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<GuideApplicationResponse> updateMyApplication(@ModelAttribute GuideApplicationRequest request) {
        return ApiResponse.<GuideApplicationResponse>builder()
                .result(applicationService.updateMyApplication(request))
                .build();
    }

    @Operation(summary = "Get all guide applications", description = "Admin only. Can filter by status.")
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Page<GuideApplicationResponse>> getAll(
            @RequestParam(required = false) ApplicationStatus status,
            Pageable pageable) {
        return ApiResponse.<Page<GuideApplicationResponse>>builder()
                .result(applicationService.getApplications(status, pageable))
                .build();
    }

    @Operation(summary = "Process a guide application", description = "Admin only. Approve, Reject, or request more info.")
    @PostMapping("/{id}/process")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<GuideApplicationResponse> process(
            @PathVariable String id,
            @RequestParam ApplicationStatus status,
            @RequestParam(required = false) String reason,
            @RequestParam(required = false) String adminNotes) {
        return ApiResponse.<GuideApplicationResponse>builder()
                .result(applicationService.processApplication(id, status, reason, adminNotes))
                .build();
    }

    @Operation(summary = "Update interview status", description = "Admin only. Set interview date and result.")
    @PostMapping("/{id}/interview")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<GuideApplicationResponse> updateInterview(
            @PathVariable String id,
            @RequestParam InterviewStatus status,
            @RequestParam(required = false) String note,
            @RequestParam(required = false) Instant date) {
        return ApiResponse.<GuideApplicationResponse>builder()
                .result(applicationService.updateInterview(id, status, note, date))
                .build();
    }

    @Operation(summary = "Update training result", description = "Admin only. Record training completion and score.")
    @PostMapping("/{id}/training")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<GuideApplicationResponse> updateTraining(
            @PathVariable String id,
            @RequestParam Boolean completed,
            @RequestParam(required = false) Integer score) {
        return ApiResponse.<GuideApplicationResponse>builder()
                .result(applicationService.updateTraining(id, completed, score))
                .build();
    }

    @Operation(summary = "Get document file", description = "Serve physical file using relative path.")
    @GetMapping("/documents")
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER', 'GUIDE')")
    public ResponseEntity<byte[]> getDocument(@RequestParam String path) {
        byte[] image = storageService.readFile(path);
        
        MediaType contentType = MediaType.IMAGE_JPEG;
        if (path.toLowerCase().endsWith(".png")) contentType = MediaType.IMAGE_PNG;
        else if (path.toLowerCase().endsWith(".pdf")) contentType = MediaType.APPLICATION_PDF;

        return ResponseEntity.ok()
                .contentType(contentType)
                .body(image);
    }
}
