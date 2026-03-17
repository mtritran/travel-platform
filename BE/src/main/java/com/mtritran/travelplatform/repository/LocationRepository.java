package com.mtritran.travelplatform.repository;

import com.mtritran.travelplatform.entity.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LocationRepository extends JpaRepository<Location, String> {
    Optional<Location> findByName(String name);
}
