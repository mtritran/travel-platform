package com.mtritran.travelplatform.controller;

import com.mtritran.travelplatform.dto.request.PayoutCreateRequest;
import com.mtritran.travelplatform.dto.response.ApiResponse;
import com.mtritran.travelplatform.entity.PayoutRequest;
import com.mtritran.travelplatform.enums.PayoutStatus;
import com.mtritran.travelplatform.service.PayoutService;
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
@RequestMapping("/payouts")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "Payout", description = "APIs for withdrawal management")
public class PayoutController {
    PayoutService payoutService;

    @Operation(summary = "Create payout request", description = "Guide only. Request withdrawal of earnings.")
    @PreAuthorize("hasRole('GUIDE')")
    @PostMapping
    public ApiResponse<PayoutRequest> createRequest(@Valid @RequestBody PayoutCreateRequest request) {
        return ApiResponse.<PayoutRequest>builder()
                .result(payoutService.createRequest(request.getAmount(), request.getBankName(), request.getBankAccountNumber(), request.getBankAccountName()))
                .build();
    }

    @Operation(summary = "Get my payout requests")
    @PreAuthorize("hasRole('GUIDE')")
    @GetMapping("/me")
    public ApiResponse<List<PayoutRequest>> getMyRequests() {
        return ApiResponse.<List<PayoutRequest>>builder()
                .result(payoutService.getMyRequests())
                .build();
    }

    @Operation(summary = "Admin: Get all pending requests")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/pending")
    public ApiResponse<List<PayoutRequest>> getPending() {
        return ApiResponse.<List<PayoutRequest>>builder()
                .result(payoutService.getAllPending())
                .build();
    }

    @Operation(summary = "Admin: Process payout request")
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/process")
    public ApiResponse<PayoutRequest> processRequest(@PathVariable String id, @RequestParam PayoutStatus status, @RequestParam(required = false) String adminNote) {
        return ApiResponse.<PayoutRequest>builder()
                .result(payoutService.processRequest(id, status, adminNote))
                .build();
    }
}
