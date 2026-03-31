package com.mtritran.travelplatform.controller;

import com.mtritran.travelplatform.dto.request.GuideApplicationRequest;
import com.mtritran.travelplatform.dto.response.ApiResponse;
import com.mtritran.travelplatform.dto.response.GuideApplicationResponse;
import com.mtritran.travelplatform.enums.ApplicationStatus;
import com.mtritran.travelplatform.service.GuideApplicationService;
import com.mtritran.travelplatform.service.StorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/guide-applications")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "Guide Application", description = "APIs for managing guide applications")
public class GuideApplicationController {

    GuideApplicationService applicationService;
    StorageService storageService;

    @Operation(summary = "Apply for a guide role", description = "Upload ID card, guide card, and certificate files.")
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

    @Operation(summary = "Update my guide application", description = "Update current user's guide application files. Only valid if current status is PENDING or REJECTED.")
    @PutMapping(value = "/my-application", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<GuideApplicationResponse> updateMyApplication(@ModelAttribute GuideApplicationRequest request) {
        return ApiResponse.<GuideApplicationResponse>builder()
                .result(applicationService.updateMyApplication(request))
                .build();
    }

    @Operation(summary = "Get all guide applications", description = "Admin only. Can filter by status.")
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<GuideApplicationResponse>> getAll(@RequestParam(required = false) ApplicationStatus status) {
        return ApiResponse.<List<GuideApplicationResponse>>builder()
                .result(applicationService.getApplications(status))
                .build();
    }

    @Operation(summary = "Process a guide application", description = "Admin only. Approve or reject an application.")
    @PostMapping("/{id}/process")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<GuideApplicationResponse> process(
            @PathVariable String id,
            @RequestParam ApplicationStatus status,
            @RequestParam(required = false) String reason,
            @RequestParam(required = false) String languages,
            @RequestParam(required = false) Integer yearsOfExperience) {
        return ApiResponse.<GuideApplicationResponse>builder()
                .result(applicationService.processApplication(id, status, reason, languages, yearsOfExperience))
                .build();
    }

    @Operation(summary = "Get document file", description = "Serve physical file using relative path.")
    @GetMapping("/documents")
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER', 'GUIDE')")
    public ResponseEntity<byte[]> getDocument(@RequestParam String path) {
        // In a real app, you should add more checks here to ensure 
        // the user has permission to view this specific file
        byte[] image = storageService.readFile(path);
        
        MediaType contentType = MediaType.IMAGE_JPEG;
        if (path.toLowerCase().endsWith(".png")) contentType = MediaType.IMAGE_PNG;
        else if (path.toLowerCase().endsWith(".pdf")) contentType = MediaType.APPLICATION_PDF;

        return ResponseEntity.ok()
                .contentType(contentType)
                .body(image);
    }
}
