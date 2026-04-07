package com.mtritran.travelplatform.controller;

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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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
}
