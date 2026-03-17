package com.mtritran.travelplatform.config;

import com.mtritran.travelplatform.entity.Location;
import com.mtritran.travelplatform.entity.Role;
import com.mtritran.travelplatform.entity.User;
import com.mtritran.travelplatform.enums.RoleName;
import com.mtritran.travelplatform.exception.AppException;
import com.mtritran.travelplatform.exception.ErrorCode;
import com.mtritran.travelplatform.repository.LocationRepository;
import com.mtritran.travelplatform.repository.RoleRepository;
import com.mtritran.travelplatform.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.HashSet;
import java.util.Set;

@Configuration
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Slf4j
public class ApplicationInitConfig {

    @Value("${initial.admin.email}")
    String adminEmail;

    @Value("${initial.admin.password}")
    String adminPassword;

    @Value("${initial.admin.fullname}")
    String adminFullName;

    @Value("${initial.admin.phone}")
    String adminPhone;

    @Bean
    CommandLineRunner initData(
            RoleRepository roleRepository,
            UserRepository userRepository,
            LocationRepository locationRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            // Seed Roles
            for (RoleName roleName : RoleName.values()) {
                if (roleRepository.findByName(roleName).isEmpty()) {
                    Role role = Role.builder()
                            .name(roleName)
                            .description(roleName.name() + " role")
                            .build();
                    roleRepository.save(role);
                    log.info("Role {} has been created", roleName);
                }
            }

            // Seed Admin
            if (!userRepository.existsByEmail(adminEmail)) {
                Role adminRole = roleRepository.findByName(RoleName.ADMIN)
                        .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

                Set<Role> roles = new HashSet<>();
                roles.add(adminRole);

                User adminUser = User.builder()
                        .email(adminEmail)
                        .password(passwordEncoder.encode(adminPassword))
                        .fullName(adminFullName)
                        .phone(adminPhone)
                        .roles(roles)
                        .build();

                userRepository.save(adminUser);
                log.info("Admin user has been created with email: {}", adminEmail);
            }

            // Seed Locations
            if (locationRepository.count() == 0) {
                locationRepository.save(Location.builder()
                        .name("Đà Lạt")
                        .address("Thành phố Đà Lạt, Lâm Đồng")
                        .latitude(11.9404)
                        .longitude(108.4583)
                        .imageUrl("https://example.com/dalat.jpg")
                        .build());
                locationRepository.save(Location.builder()
                        .name("Hội An")
                        .address("Thành phố Hội An, Quảng Nam")
                        .latitude(15.8801)
                        .longitude(108.3380)
                        .imageUrl("https://example.com/hoian.jpg")
                        .build());
                locationRepository.save(Location.builder()
                        .name("Huế")
                        .address("Thành phố Huế, Thừa Thiên Huế")
                        .latitude(16.4637)
                        .longitude(107.5909)
                        .imageUrl("https://example.com/hue.jpg")
                        .build());
                log.info("Initial locations have been seeded");
            }
        };
    }
}
