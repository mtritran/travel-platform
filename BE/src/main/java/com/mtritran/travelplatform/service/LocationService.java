package com.mtritran.travelplatform.service;

import com.mtritran.travelplatform.dto.request.LocationCreateRequest;
import com.mtritran.travelplatform.dto.response.LocationResponse;
import com.mtritran.travelplatform.entity.Location;
import com.mtritran.travelplatform.exception.AppException;
import com.mtritran.travelplatform.exception.ErrorCode;
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

    public LocationResponse createLocation(LocationCreateRequest request) {
        var existing = locationRepository.findByName(request.getName());
        if (existing.isPresent()) {
            return locationMapper.toResponse(existing.get());
        }

        Location location = Location.builder()
                .name(request.getName())
                .address(request.getAddress())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .imageUrl(request.getImageUrl())
                .build();
        return locationMapper.toResponse(locationRepository.save(location));
    }

    public LocationResponse updateLocation(String id, LocationCreateRequest request) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.LOCATION_NOT_FOUND));
        
        location.setName(request.getName());
        location.setAddress(request.getAddress());
        location.setLatitude(request.getLatitude());
        location.setLongitude(request.getLongitude());
        location.setImageUrl(request.getImageUrl());
        
        return locationMapper.toResponse(locationRepository.save(location));
    }

    public void deleteLocation(String id) {
        if (!locationRepository.existsById(id)) {
            throw new AppException(ErrorCode.LOCATION_NOT_FOUND);
        }
        locationRepository.deleteById(id);
    }
}
