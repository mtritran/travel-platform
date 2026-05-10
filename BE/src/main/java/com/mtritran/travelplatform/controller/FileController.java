package com.mtritran.travelplatform.controller;

import com.mtritran.travelplatform.dto.response.ApiResponse;
import com.mtritran.travelplatform.service.StorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/files")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "File", description = "APIs for serving files")
public class FileController {

    StorageService storageService;

    @Operation(summary = "Get file", description = "Serve physical file using relative path.")
    @GetMapping
    public ResponseEntity<Resource> getFile(@RequestParam String path) {
        byte[] data = storageService.readFile(path);
        ByteArrayResource resource = new ByteArrayResource(data);

        MediaType contentType = MediaType.IMAGE_JPEG;
        if (path.toLowerCase().endsWith(".png")) contentType = MediaType.IMAGE_PNG;
        else if (path.toLowerCase().endsWith(".gif")) contentType = MediaType.IMAGE_GIF;
        else if (path.toLowerCase().endsWith(".pdf")) contentType = MediaType.APPLICATION_PDF;

        return ResponseEntity.ok()
                .contentType(contentType)
                .body(resource);
    }

    @Operation(summary = "Upload file", description = "Upload a file and get the relative path.")
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<String> uploadFile(@RequestPart("file") MultipartFile file) {
        String path = storageService.saveFile(file, "tours");
        return ApiResponse.<String>builder()
                .result(path)
                .build();
    }
}
