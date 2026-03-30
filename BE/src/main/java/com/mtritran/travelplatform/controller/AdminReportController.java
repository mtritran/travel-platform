package com.mtritran.travelplatform.controller;

import com.mtritran.travelplatform.dto.response.ApiResponse;
import com.mtritran.travelplatform.service.AdminReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/admin/reports")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "Admin Report", description = "Financial reports for platform owner")
public class AdminReportController {
    AdminReportService adminReportService;

    @Operation(summary = "Get platform financial summary", description = "Admin only.")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/financial")
    public ApiResponse<Map<String, Object>> getFinancialSummary() {
        return ApiResponse.<Map<String, Object>>builder()
                .result(adminReportService.getFinancialSummary())
                .build();
    }
}
