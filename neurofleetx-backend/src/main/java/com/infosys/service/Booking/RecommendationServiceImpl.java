package com.infosys.service.Booking;

import com.infosys.model.Vehicle;
import com.infosys.repository.BookingRepository;
import com.infosys.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/*
 Purpose: Lightweight recommendation engine:
  - prefer vehicles of requested type and EV flag
  - prefer vehicles nearest to city center (or random) — placeholder for distance
  - exclude vehicles with overlapping confirmed bookings
*/
@Service
public class RecommendationServiceImpl implements RecommendationService {

    @Autowired
    private VehicleRepository vehicleRepo;

    @Autowired
    private BookingRepository bookingRepo;

    @Override
    public List<Vehicle> recommendVehicles(Long customerId, String vehicleType, Boolean isEv, LocalDateTime start, LocalDateTime end, int limit) {
        List<Vehicle> vehicles = vehicleRepo.findAll();

        // Filter by type and EV
        List<Vehicle> filtered = vehicles.stream().filter(v -> {
            if (isEv != null && isEv && (v.getIsEv() == null || !v.getIsEv())) return false;

            if (vehicleType != null && !vehicleType.isEmpty()) {
                if (v.getType() == null || v.getType().getName() == null ||
                        !vehicleType.equalsIgnoreCase(v.getType().getName())) {
                    return false;
                }
            }

            return true;
        }).collect(Collectors.toList());

        // Remove vehicles with overlapping confirmed bookings
        filtered = filtered.stream().filter(v -> {
            List<?> overlaps = bookingRepo.findOverlappingConfirmed(v.getId(), start, end);
            return overlaps == null || overlaps.isEmpty();
        }).collect(Collectors.toList());

        // Sort: lower mileage preferred, then higher battery
        filtered.sort(Comparator
                .comparing((Vehicle v) -> v.getMileage() == null ? Double.MAX_VALUE : v.getMileage())
                .thenComparing((Vehicle v) -> -(v.getBatteryLevel() == null ? 0.0 : v.getBatteryLevel())));

        return filtered.stream().limit(limit).collect(Collectors.toList());
    }
}
