package com.mtritran.travelplatform.service;

import com.mtritran.travelplatform.dto.response.LocationResponse;
import com.mtritran.travelplatform.mapper.LocationMapper;
import com.mtritran.travelplatform.repository.LocationRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class LocationService {
    LocationRepository locationRepository;
    LocationMapper locationMapper;

    public List<LocationResponse> getAllLocations() {
        return locationRepository.findAll().stream()
                .map(locationMapper::toResponse)
                .toList();
    }
}
