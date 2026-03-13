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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserService {
    UserRepository userRepository;
    UserMapper userMapper;
    RoleRepository roleRepository;
    PasswordEncoder passwordEncoder;

    public UserResponse createUser(UserCreateRequest request) {
        if (userRepository.existsByEmail(request.getEmail())){
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        if (userRepository.existsByPhone(request.getPhone())){
            throw new AppException(ErrorCode.PHONE_EXISTED);
        }

        User user = userMapper.toUser(request);

        user.setPassword(passwordEncoder.encode(request.getPassword()));

        Role customerRole = roleRepository.findByName(RoleName.CUSTOMER)
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
        user.setRoles(new HashSet<>(Set.of(customerRole)));

        return userMapper.toResponse(userRepository.save(user));
    }

    public List<UserResponse> getAllUsers(){
        return userRepository.findAll()
                .stream()
                .map(userMapper::toResponse)
                .toList();
    }

    public UserResponse getUserById(String id){
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return userMapper.toResponse(user);
    }

    public UserResponse updateUserById(String id, UserUpdateRequest request){
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        userMapper.updateUser(user, request);

        if (request.getPassword() != null){
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        return userMapper.toResponse(userRepository.save(user));
    }

    public void deleteUser(String id){
        if (!userRepository.existsById(id)) {
            throw new AppException(ErrorCode.USER_NOT_EXISTED);
        }

        userRepository.deleteById(id);
    }
}
