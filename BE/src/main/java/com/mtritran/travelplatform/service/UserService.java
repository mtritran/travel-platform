package com.mtritran.travelplatform.service;

import com.mtritran.travelplatform.dto.request.UserCreateRequest;
import com.mtritran.travelplatform.dto.request.UserUpdateRequest;
import com.mtritran.travelplatform.dto.response.UserResponse;
import com.mtritran.travelplatform.entity.Role;
import com.mtritran.travelplatform.entity.User;
import com.mtritran.travelplatform.enums.RoleName;
import com.mtritran.travelplatform.exception.AppException;
import com.mtritran.travelplatform.exception.ErrorCode;
import com.mtritran.travelplatform.mapper.UserMapper;
import com.mtritran.travelplatform.repository.RoleRepository;
import com.mtritran.travelplatform.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserService {
    UserRepository userRepository;
    UserMapper userMapper;
    RoleRepository roleRepository;
    PasswordEncoder passwordEncoder;
    OtpService otpService;
    StorageService storageService;

    public UserResponse createUser(UserCreateRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        if (!otpService.verifyOtp(request.getEmail(), request.getOtpCode())) {
            throw new AppException(ErrorCode.INVALID_OTP);
        }

        User user = userMapper.toUser(request);

        user.setPassword(passwordEncoder.encode(request.getPassword()));

        Role customerRole = roleRepository.findByName(RoleName.CUSTOMER)
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
        user.setRoles(new HashSet<>(Set.of(customerRole)));

        return userMapper.toResponse(userRepository.save(user));
    }

    //OFFSET = PageNumber x Limit
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable)
                .map(userMapper::toResponse);
    }

    public UserResponse getUserById(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return userMapper.toResponse(user);
    }

    public UserResponse updateUserById(String id, UserUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        userMapper.updateUser(user, request);

        if (request.getPassword() != null) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            Set<Role> updatedRoles = new HashSet<>();
            for (String rName : request.getRoles()) {
                try {
                    RoleName enumRole = RoleName.valueOf(rName);
                    roleRepository.findByName(enumRole).ifPresent(updatedRoles::add);
                } catch (IllegalArgumentException e) {
                    // Ignore invalid roles
                }
            }
            if (!updatedRoles.isEmpty()) {
                user.setRoles(updatedRoles);
            }
        }

        return userMapper.toResponse(userRepository.save(user));
    }

    public void deleteUser(String id) {
        if (!userRepository.existsById(id)) {
            throw new AppException(ErrorCode.USER_NOT_EXISTED);
        }

        userRepository.deleteById(id);
    }

    public UserResponse getMyInfo() {
        String name = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(name).orElseThrow(
                () -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return userMapper.toResponse(user);
    }

    @Transactional
    public UserResponse updateAvatar(MultipartFile file) {
        String name = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(name).orElseThrow(
                () -> new AppException(ErrorCode.USER_NOT_EXISTED));

        String oldAvatarUrl = user.getAvatarUrl();

        // 1. Save new avatar to avatars/{userId}/ namespace
        String newPath = storageService.saveFile(file, "avatars/" + user.getId());

        // 2. Update database
        user.setAvatarUrl(newPath);
        UserResponse response = userMapper.toResponse(userRepository.save(user));

        // 3. Delete old avatar if exists
        if (oldAvatarUrl != null) {
            storageService.deleteFile(oldAvatarUrl);
        }

        return response;
    }

    public UserResponse updateMyInfo(UserUpdateRequest request) {
        String name = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(name).orElseThrow(
                () -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (request.getFullName() != null)
            user.setFullName(request.getFullName());
        if (request.getPhone() != null)
            user.setPhone(request.getPhone());
        if (request.getPaymentPin() != null && !request.getPaymentPin().isBlank()) {
            user.setPaymentPin(passwordEncoder.encode(request.getPaymentPin()));
        }
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            if (request.getOldPassword() == null || request.getOldPassword().isBlank()
                    || !passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
                throw new AppException(ErrorCode.PASSWORD_INCORRECT);
            }
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        if (request.getBiography() != null)
            user.setBiography(request.getBiography());
        if (request.getLanguages() != null)
            user.setLanguages(request.getLanguages());
        if (request.getYearsOfExperience() != null)
            user.setYearsOfExperience(request.getYearsOfExperience());
        if (request.getSpecialties() != null)
            user.setSpecialties(request.getSpecialties());

        return userMapper.toResponse(userRepository.save(user));
    }
}
