package com.mtritran.travelplatform.service;

import com.mtritran.travelplatform.dto.request.GuideApplicationRequest;
import com.mtritran.travelplatform.dto.response.GuideApplicationResponse;
import com.mtritran.travelplatform.entity.GuideApplication;
import com.mtritran.travelplatform.entity.Role;
import com.mtritran.travelplatform.entity.User;
import com.mtritran.travelplatform.enums.ApplicationStatus;
import com.mtritran.travelplatform.enums.InterviewStatus;
import com.mtritran.travelplatform.enums.RoleName;
import com.mtritran.travelplatform.exception.AppException;
import com.mtritran.travelplatform.exception.ErrorCode;
import com.mtritran.travelplatform.mapper.GuideApplicationMapper;
import com.mtritran.travelplatform.repository.GuideApplicationRepository;
import com.mtritran.travelplatform.repository.RoleRepository;
import com.mtritran.travelplatform.repository.UserRepository;
import com.mtritran.travelplatform.service.ai.GuideRecommendationService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

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
    GuideRecommendationService guideRecommendationService;

    private static final long COOLDOWN_DAYS_PER_REJECTION = 7L;

    @Transactional
    public GuideApplicationResponse createApplication(GuideApplicationRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        Optional<GuideApplication> existingOpt = applicationRepository.findByUser(user);
        if (existingOpt.isPresent()) {
            GuideApplication existing = existingOpt.get();
            if (existing.getStatus() == ApplicationStatus.APPROVED) {
                throw new AppException(ErrorCode.ALREADY_A_GUIDE);
            }
            if (existing.getStatus() == ApplicationStatus.REJECTED) {
                if (existing.getCooldownUntil() != null && existing.getCooldownUntil().isAfter(Instant.now())) {
                    throw new AppException(ErrorCode.APPLICATION_COOLDOWN);
                }
            } else if (existing.getStatus() != ApplicationStatus.NEED_MORE_INFO) {
                throw new AppException(ErrorCode.APPLICATION_EXISTED);
            }
        }

        List<String> uploadedUrls = new ArrayList<>();
        try {
            String userFolder = "applications/" + user.getEmail().replaceAll("[^a-zA-Z0-9.-]", "_");
            
            String profilePhotoUrl = storageService.saveFile(request.getProfilePhotoFile(), userFolder);
            uploadedUrls.add(profilePhotoUrl);
            String idCardUrl = storageService.saveFile(request.getIdCardFile(), userFolder);
            uploadedUrls.add(idCardUrl);
            String guideCardUrl = storageService.saveFile(request.getGuideCardFile(), userFolder);
            uploadedUrls.add(guideCardUrl);
            String certificateUrl = storageService.saveFile(request.getCertificateFile(), userFolder);
            uploadedUrls.add(certificateUrl);
            
            String criminalRecordUrl = request.getCriminalRecordFile() != null ? storageService.saveFile(request.getCriminalRecordFile(), userFolder) : null;
            if (criminalRecordUrl != null) uploadedUrls.add(criminalRecordUrl);
            String healthRecordUrl = request.getHealthRecordFile() != null ? storageService.saveFile(request.getHealthRecordFile(), userFolder) : null;
            if (healthRecordUrl != null) uploadedUrls.add(healthRecordUrl);
            String drugTestResultUrl = request.getDrugTestFile() != null ? storageService.saveFile(request.getDrugTestFile(), userFolder) : null;
            if (drugTestResultUrl != null) uploadedUrls.add(drugTestResultUrl);

            GuideApplication application = GuideApplication.builder()
                    .id(existingOpt.map(GuideApplication::getId).orElse(null))
                    .user(user)
                    .profilePhotoUrl(profilePhotoUrl)
                    .idCardUrl(idCardUrl)
                    .idCardExpiry(request.getIdCardExpiry())
                    .guideCardUrl(guideCardUrl)
                    .guideCardExpiry(request.getGuideCardExpiry())
                    .certificateUrl(certificateUrl)
                    .certificateExpiry(request.getCertificateExpiry())
                    .criminalRecordUrl(criminalRecordUrl)
                    .criminalRecordIssuedAt(request.getCriminalRecordIssuedAt())
                    .healthRecordUrl(healthRecordUrl)
                    .healthRecordDate(request.getHealthRecordDate())
                    .drugTestResultUrl(drugTestResultUrl)
                    .drugTestDate(request.getDrugTestDate())
                    .languages(request.getLanguages())
                    .specializations(request.getSpecializations())
                    .operatingAreas(request.getOperatingAreas())
                    .yearsOfExperience(request.getYearsOfExperience())
                    .status(ApplicationStatus.PENDING)
                    .rejectCount(existingOpt.map(GuideApplication::getRejectCount).orElse(0))
                    .build();

            return applicationMapper.toResponse(applicationRepository.save(application));
        } catch (Exception e) {
            uploadedUrls.forEach(storageService::deleteFile);
            throw e;
        }
    }

    public Page<GuideApplicationResponse> getApplications(ApplicationStatus status, Pageable pageable) {
        if (status != null) {
            return applicationRepository.findAllByStatus(status, pageable)
                    .map(applicationMapper::toResponse);
        }
        return applicationRepository.findAll(pageable)
                .map(applicationMapper::toResponse);
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
            throw new AppException(ErrorCode.CANNOT_MODIFY_APPROVED_APPLICATION);
        }

        String userFolder = "applications/" + user.getEmail().replaceAll("[^a-zA-Z0-9.-]", "_");
        List<String> oldUrlsToDelete = new ArrayList<>();

        if (request.getProfilePhotoFile() != null && !request.getProfilePhotoFile().isEmpty()) {
            oldUrlsToDelete.add(application.getProfilePhotoUrl());
            application.setProfilePhotoUrl(storageService.saveFile(request.getProfilePhotoFile(), userFolder));
        }
        if (request.getIdCardFile() != null && !request.getIdCardFile().isEmpty()) {
            oldUrlsToDelete.add(application.getIdCardUrl());
            application.setIdCardUrl(storageService.saveFile(request.getIdCardFile(), userFolder));
        }
        if (request.getGuideCardFile() != null && !request.getGuideCardFile().isEmpty()) {
            oldUrlsToDelete.add(application.getGuideCardUrl());
            application.setGuideCardUrl(storageService.saveFile(request.getGuideCardFile(), userFolder));
        }
        if (request.getCertificateFile() != null && !request.getCertificateFile().isEmpty()) {
            oldUrlsToDelete.add(application.getCertificateUrl());
            application.setCertificateUrl(storageService.saveFile(request.getCertificateFile(), userFolder));
        }
        if (request.getCriminalRecordFile() != null && !request.getCriminalRecordFile().isEmpty()) {
            if (application.getCriminalRecordUrl() != null) oldUrlsToDelete.add(application.getCriminalRecordUrl());
            application.setCriminalRecordUrl(storageService.saveFile(request.getCriminalRecordFile(), userFolder));
        }
        if (request.getHealthRecordFile() != null && !request.getHealthRecordFile().isEmpty()) {
            if (application.getHealthRecordUrl() != null) oldUrlsToDelete.add(application.getHealthRecordUrl());
            application.setHealthRecordUrl(storageService.saveFile(request.getHealthRecordFile(), userFolder));
        }
        if (request.getDrugTestFile() != null && !request.getDrugTestFile().isEmpty()) {
            if (application.getDrugTestResultUrl() != null) oldUrlsToDelete.add(application.getDrugTestResultUrl());
            application.setDrugTestResultUrl(storageService.saveFile(request.getDrugTestFile(), userFolder));
        }

        if (request.getIdCardExpiry() != null) application.setIdCardExpiry(request.getIdCardExpiry());
        if (request.getGuideCardExpiry() != null) application.setGuideCardExpiry(request.getGuideCardExpiry());
        if (request.getCertificateExpiry() != null) application.setCertificateExpiry(request.getCertificateExpiry());
        if (request.getCriminalRecordIssuedAt() != null) application.setCriminalRecordIssuedAt(request.getCriminalRecordIssuedAt());
        if (request.getHealthRecordDate() != null) application.setHealthRecordDate(request.getHealthRecordDate());
        if (request.getDrugTestDate() != null) application.setDrugTestDate(request.getDrugTestDate());

        if (request.getLanguages() != null) application.setLanguages(request.getLanguages());
        if (request.getSpecializations() != null) application.setSpecializations(request.getSpecializations());
        if (request.getOperatingAreas() != null) application.setOperatingAreas(request.getOperatingAreas());
        if (request.getYearsOfExperience() != null) application.setYearsOfExperience(request.getYearsOfExperience());

        application.setStatus(ApplicationStatus.PENDING);
        application.setRejectionReason(null);

        GuideApplication saved = applicationRepository.save(application);
        
        // Cleanup old files after successful save
        oldUrlsToDelete.stream().filter(url -> url != null && !url.isEmpty()).forEach(storageService::deleteFile);

        return applicationMapper.toResponse(saved);
    }

    @Transactional
    public GuideApplicationResponse processApplication(String applicationId, ApplicationStatus status, String reason, String adminNotes) {
        String adminEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        GuideApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new AppException(ErrorCode.APPLICATION_NOT_FOUND));

        if (application.getStatus() == ApplicationStatus.APPROVED) {
            throw new AppException(ErrorCode.APPLICATION_ALREADY_APPROVED);
        }

        // Validate Status Transition
        Set<ApplicationStatus> allowedStatuses = Set.of(
            ApplicationStatus.APPROVED,
            ApplicationStatus.REJECTED,
            ApplicationStatus.NEED_MORE_INFO,
            ApplicationStatus.UNDER_REVIEW
        );
        if (!allowedStatuses.contains(status)) {
            throw new AppException(ErrorCode.INVALID_APPLICATION_STATUS);
        }

        application.setStatus(status);
        application.setProcessedBy(admin);
        application.setProcessedAt(Instant.now());
        application.setAdminNotes(adminNotes);

        if (status == ApplicationStatus.APPROVED) {
            User user = application.getUser();
            Role guideRole = roleRepository.findByName(RoleName.GUIDE)
                    .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

            if (!user.getRoles().contains(guideRole)) {
                user.getRoles().add(guideRole);
            }
            
            user.setLanguages(application.getLanguages());
            user.setSpecialties(application.getSpecializations());
            user.setOperatingAreas(application.getOperatingAreas());
            user.setYearsOfExperience(application.getYearsOfExperience());
            user.setAvatarUrl(application.getProfilePhotoUrl());

            User savedGuide = userRepository.save(user);

            // Auto-index guide profile into Vector DB for RAG
            guideRecommendationService.indexGuide(savedGuide);
            log.info("Auto-indexed new Guide '{}' into Vector DB after approval.", savedGuide.getFullName());

        } else if (status == ApplicationStatus.REJECTED) {
            if (reason == null || reason.isBlank()) {
                throw new AppException(ErrorCode.REJECTION_REASON_REQUIRED);
            }
            application.setRejectionReason(reason);
            application.setRejectCount(application.getRejectCount() + 1);
            application.setLastRejectedAt(Instant.now());
            
            long cooldownDays = COOLDOWN_DAYS_PER_REJECTION * application.getRejectCount();
            application.setCooldownUntil(Instant.now().plus(cooldownDays, ChronoUnit.DAYS));
            
        } else if (status == ApplicationStatus.NEED_MORE_INFO) {
            if (adminNotes == null || adminNotes.isBlank()) {
                throw new AppException(ErrorCode.REJECTION_REASON_REQUIRED); // Or specific code for info notes
            }
        }

        return applicationMapper.toResponse(applicationRepository.save(application));
    }

    @Transactional
    public GuideApplicationResponse updateInterview(String applicationId, InterviewStatus status, String note, Instant date) {
        String adminEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        GuideApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new AppException(ErrorCode.APPLICATION_NOT_FOUND));

        application.setInterviewStatus(status);
        application.setInterviewNote(note);
        application.setInterviewDate(date);
        application.setInterviewedBy(admin);

        return applicationMapper.toResponse(applicationRepository.save(application));
    }

    @Transactional
    public GuideApplicationResponse updateTraining(String applicationId, Boolean completed, Integer score) {
        GuideApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new AppException(ErrorCode.APPLICATION_NOT_FOUND));

        application.setTrainingCompleted(completed);
        application.setTrainingScore(score);
        if (Boolean.TRUE.equals(completed)) {
            application.setTrainingCompletedAt(Instant.now());
        }

        return applicationMapper.toResponse(applicationRepository.save(application));
    }
}
