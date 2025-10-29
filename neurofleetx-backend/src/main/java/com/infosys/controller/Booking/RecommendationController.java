package com.infosys.controller.Booking;

import com.infosys.model.Vehicle;
import com.infosys.service.Booking.RecommendationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/recommend")
@CrossOrigin(origins = "*")
public class RecommendationController {

    @Autowired
    private RecommendationService recommendationService;

    @GetMapping("/vehicles")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('MANAGER') or hasRole('ADMIN')")
    public List<Vehicle> recommend(
            @RequestParam Long customerId,
            @RequestParam(required = false) String vehicleType,
            @RequestParam(required = false) Boolean isEv,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            @RequestParam(defaultValue = "5") int limit
    ) {
        return recommendationService.recommendVehicles(customerId, vehicleType, isEv, start, end, limit);
    }
}
