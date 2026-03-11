package com.mtritran.travelplatform.config;

import com.mtritran.travelplatform.entity.Role;
import com.mtritran.travelplatform.enums.RoleName;
import com.mtritran.travelplatform.repository.RoleRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ApplicationInitConfig {

    @Bean
    CommandLineRunner initData(RoleRepository roleRepository) {
        return args -> {
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
        };
    }
}
