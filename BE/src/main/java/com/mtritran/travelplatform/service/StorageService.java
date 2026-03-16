package com.mtritran.travelplatform.service;

import com.mtritran.travelplatform.exception.AppException;
import com.mtritran.travelplatform.exception.ErrorCode;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@Slf4j
public class StorageService {

    @Value("${storage.upload-dir}")
    private String uploadDir;

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(Paths.get(uploadDir));
        } catch (IOException e) {
            log.error("Could not initialize storage", e);
            throw new AppException(ErrorCode.UPLOAD_FAILED);
        }
    }

    public String saveFile(MultipartFile file, String subDir) {
        if (file.isEmpty()) {
            throw new AppException(ErrorCode.FILE_REQUIRED);
        }

        try {
            // Create sub-directory if specified
            Path uploadPath = Paths.get(uploadDir, subDir);
            Files.createDirectories(uploadPath);

            // Generate random file name using UUID
            String originalFileName = file.getOriginalFilename();
            String extension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                extension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }
            String fileName = UUID.randomUUID().toString() + extension;

            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Return relative path for DB storage
            return Paths.get(subDir, fileName).toString().replace("\\", "/");

        } catch (IOException e) {
            log.error("Failed to store file", e);
            throw new AppException(ErrorCode.UPLOAD_FAILED);
        }
    }

    public byte[] readFile(String relativePath) {
        try {
            Path filePath = Paths.get(uploadDir).resolve(relativePath);
            if (!Files.exists(filePath)) {
                throw new AppException(ErrorCode.FILE_NOT_FOUND);
            }
            return Files.readAllBytes(filePath);
        } catch (IOException e) {
            log.error("Failed to read file", e);
            throw new AppException(ErrorCode.FILE_NOT_FOUND);
        }
    }

    public void deleteFile(String relativePath) {
        if (relativePath == null || relativePath.isEmpty()) return;
        try {
            Path filePath = Paths.get(uploadDir).resolve(relativePath);
            if (Files.exists(filePath)) {
                Files.delete(filePath);
            }
        } catch (IOException e) {
            log.error("Failed to delete file: {}", relativePath, e);
        }
    }
}
