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
                .languages(request.getLanguages())
                .yearsOfExperience(request.getYearsOfExperience())
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

        String oldIdCardUrl = null;
        if (request.getIdCardFile() != null && !request.getIdCardFile().isEmpty()) {
            oldIdCardUrl = application.getIdCardUrl();
            application.setIdCardUrl(storageService.saveFile(request.getIdCardFile(), userFolder));
        }

        String oldGuideCardUrl = null;
        if (request.getGuideCardFile() != null && !request.getGuideCardFile().isEmpty()) {
            oldGuideCardUrl = application.getGuideCardUrl();
            application.setGuideCardUrl(storageService.saveFile(request.getGuideCardFile(), userFolder));
        }

        String oldCertificateUrl = null;
        if (request.getCertificateFile() != null && !request.getCertificateFile().isEmpty()) {
            oldCertificateUrl = application.getCertificateUrl();
            application.setCertificateUrl(storageService.saveFile(request.getCertificateFile(), userFolder));
        }

        if (request.getLanguages() != null) {
            application.setLanguages(request.getLanguages());
        }

        if (request.getYearsOfExperience() != null) {
            application.setYearsOfExperience(request.getYearsOfExperience());
        }

        application.setStatus(ApplicationStatus.PENDING);
        application.setRejectionReason(null);

        GuideApplicationResponse response = applicationMapper.toResponse(applicationRepository.save(application));

        // Delete old files only after database is successfully updated
        if (oldIdCardUrl != null) {
            storageService.deleteFile(oldIdCardUrl);
        }
        if (oldGuideCardUrl != null) {
            storageService.deleteFile(oldGuideCardUrl);
        }
        if (oldCertificateUrl != null) {
            storageService.deleteFile(oldCertificateUrl);
        }

        return response;
    }

    @Transactional
    public GuideApplicationResponse processApplication(String applicationId, ApplicationStatus status, String reason, String languages, Integer yearsOfExperience) {
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

            // Use verified values if provided, otherwise fallback to user's input in application
            String finalLanguages = (languages != null) ? languages : application.getLanguages();
            Integer finalYears = (yearsOfExperience != null) ? yearsOfExperience : application.getYearsOfExperience();
            
            // Save verified values to entity for history
            application.setLanguages(finalLanguages);
            application.setYearsOfExperience(finalYears);

            // Upgrade user role to GUIDE
            User user = application.getUser();
            Role guideRole = roleRepository.findByName(RoleName.GUIDE)
                    .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

            if (!user.getRoles().contains(guideRole)) {
                user.getRoles().add(guideRole);
            }
            
            user.setLanguages(finalLanguages);
            user.setYearsOfExperience(finalYears);
            
            userRepository.save(user);

        } else if (status == ApplicationStatus.REJECTED) {
            application.setStatus(ApplicationStatus.REJECTED);
            application.setRejectionReason(reason);
            application.setProcessedBy(admin);
        }

        return applicationMapper.toResponse(applicationRepository.save(application));
    }
}
