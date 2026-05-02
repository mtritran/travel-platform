package com.mtritran.travelplatform.controller;

import com.mtritran.travelplatform.dto.request.TourChatRequest;
import com.mtritran.travelplatform.dto.response.ApiResponse;
import com.mtritran.travelplatform.service.ai.SupportChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/support")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "Support Chat", description = "AI Assistant for booking history and policies")
public class SupportChatController {

    SupportChatService supportChatService;

    @Operation(summary = "Chat with Support Assistant", description = "Get help with your booking history and system policies.")
    @PostMapping("/chat")
    public ApiResponse<String> chat(@RequestBody TourChatRequest request) {
        return ApiResponse.<String>builder()
                .result(supportChatService.chat(request))
                .build();
    }
}
