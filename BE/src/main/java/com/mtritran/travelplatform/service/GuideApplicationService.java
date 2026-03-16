package com.mtritran.travelplatform.service;

import com.mtritran.travelplatform.dto.request.GuideApplicationRequest;
import com.mtritran.travelplatform.dto.response.GuideApplicationResponse;
import com.mtritran.travelplatform.entity.GuideApplication;
import com.mtritran.travelplatform.entity.Role;
import com.mtritran.travelplatform.entity.User;
import com.mtritran.travelplatform.enums.ApplicationStatus;
import com.mtritran.travelplatform.enums.RoleName;
import com.mtritran.travelplatform.exception.AppException;
import com.mtritran.travelplatform.exception.ErrorCode;
import com.mtritran.travelplatform.mapper.GuideApplicationMapper;
import com.mtritran.travelplatform.repository.GuideApplicationRepository;
import com.mtritran.travelplatform.repository.RoleRepository;
import com.mtritran.travelplatform.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class GuideApplicationService {
    GuideApplicationRepository applicationRepository;
    UserRepository userRepository;
    RoleRepository roleRepository;
    StorageService storageService;
    GuideApplicationMapper applicationMapper;

    @Transactional
    public GuideApplicationResponse createApplication(GuideApplicationRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        if (applicationRepository.findByUser(user).isPresent()) {
            throw new AppException(ErrorCode.APPLICATION_EXISTED);
        }

        // Upload files, using email as subdirectory name for easier tracking
        String userFolder = "applications/" + user.getEmail().replaceAll("[^a-zA-Z0-9.-]", "_");
        String idCardUrl = storageService.saveFile(request.getIdCardFile(), userFolder);
        String guideCardUrl = storageService.saveFile(request.getGuideCardFile(), userFolder);
        String certificateUrl = storageService.saveFile(request.getCertificateFile(), userFolder);

        GuideApplication application = GuideApplication.builder()
                .user(user)
                .idCardUrl(idCardUrl)
                .guideCardUrl(guideCardUrl)
                .certificateUrl(certificateUrl)
                .status(ApplicationStatus.PENDING)
                .build();

        return applicationMapper.toResponse(applicationRepository.save(application));
    }

    public List<GuideApplicationResponse> getApplications(ApplicationStatus status) {
        if (status != null) {
            return applicationRepository.findAllByStatus(status).stream()
                    .map(applicationMapper::toResponse)
                    .toList();
        }
        return applicationRepository.findAll().stream()
                .map(applicationMapper::toResponse)
                .toList();
    }

    public GuideApplicationResponse getMyApplication() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        GuideApplication application = applicationRepository.findByUser(user)
                .orElseThrow(() -> new AppException(ErrorCode.APPLICATION_NOT_FOUND));

        return applicationMapper.toResponse(application);
    }

    @Transactional
    public GuideApplicationResponse updateMyApplication(GuideApplicationRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        GuideApplication application = applicationRepository.findByUser(user)
                .orElseThrow(() -> new AppException(ErrorCode.APPLICATION_NOT_FOUND));

        if (application.getStatus() == ApplicationStatus.APPROVED) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }

        String userFolder = "applications/" + user.getEmail().replaceAll("[^a-zA-Z0-9.-]", "_");

        if (request.getIdCardFile() != null && !request.getIdCardFile().isEmpty()) {
            storageService.deleteFile(application.getIdCardUrl());
            application.setIdCardUrl(storageService.saveFile(request.getIdCardFile(), userFolder));
        }

        if (request.getGuideCardFile() != null && !request.getGuideCardFile().isEmpty()) {
            storageService.deleteFile(application.getGuideCardUrl());
            application.setGuideCardUrl(storageService.saveFile(request.getGuideCardFile(), userFolder));
        }

        if (request.getCertificateFile() != null && !request.getCertificateFile().isEmpty()) {
            storageService.deleteFile(application.getCertificateUrl());
            application.setCertificateUrl(storageService.saveFile(request.getCertificateFile(), userFolder));
        }

        application.setStatus(ApplicationStatus.PENDING);
        application.setRejectionReason(null);

        return applicationMapper.toResponse(applicationRepository.save(application));
    }

    @Transactional
    public GuideApplicationResponse processApplication(String applicationId, ApplicationStatus status, String reason) {
        String adminEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        GuideApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));

        if (application.getStatus() != ApplicationStatus.PENDING) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }

        if (status == ApplicationStatus.APPROVED) {
            application.setStatus(ApplicationStatus.APPROVED);
            application.setProcessedBy(admin);

            // Upgrade user role to GUIDE
            User user = application.getUser();
            Role guideRole = roleRepository.findByName(RoleName.GUIDE)
                    .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

            user.getRoles().add(guideRole);
            userRepository.save(user);

        } else if (status == ApplicationStatus.REJECTED) {
            application.setStatus(ApplicationStatus.REJECTED);
            application.setRejectionReason(reason);
            application.setProcessedBy(admin);
        }

        return applicationMapper.toResponse(applicationRepository.save(application));
    }
}
