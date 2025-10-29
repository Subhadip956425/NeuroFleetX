package com.infosys.service.Booking;

import com.infosys.model.Vehicle;

import java.time.LocalDateTime;
import java.util.List;

public interface RecommendationService {
    List<Vehicle> recommendVehicles(Long customerId, String vehicleType, Boolean isEv, LocalDateTime start, LocalDateTime end, int limit);
}
