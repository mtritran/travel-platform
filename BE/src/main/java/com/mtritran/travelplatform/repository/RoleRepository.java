package com.mtritran.travelplatform.repository;

import com.mtritran.travelplatform.entity.Role;
import com.mtritran.travelplatform.enums.RoleName;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, String> {
    Optional<Role> findByName(RoleName name);
}
