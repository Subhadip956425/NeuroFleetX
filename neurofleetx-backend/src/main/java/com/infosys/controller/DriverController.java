/*
  Purpose: Driver endpoints (get assigned vehicle, report status).
  Protected with @PreAuthorize('hasRole("DRIVER")').
*/
package com.infosys.controller;

import com.infosys.dto.VehicleResponse;
import com.infosys.model.MaintenanceTicket;
import com.infosys.model.User;
import com.infosys.repository.UserRepository;
import com.infosys.service.MaintenanceService;
import com.infosys.service.VehicleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/driver")
@PreAuthorize("hasRole('DRIVER')")
public class DriverController {

    @Autowired
    private VehicleService vehicleService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private MaintenanceService maintenanceService;

    // get assigned vehicle for current driver
    @GetMapping("/my-vehicle")
    public ResponseEntity<VehicleResponse> myVehicle(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow(() -> new RuntimeException("User not found"));
        // find vehicle assigned to this driver
        VehicleResponse resp = vehicleService.listVehicles().stream()
                .filter(v -> v.getAssignedDriverId() != null && v.getAssignedDriverId().equals(user.getId()))
                .findFirst()
                .orElse(null);
        if (resp == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(resp);
    }

    // report maintenance (driver)
    @PostMapping("/report")
    public ResponseEntity<MaintenanceTicket> reportIssue(@RequestBody ReportReq req, @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow(() -> new RuntimeException("User not found"));
        MaintenanceTicket t = maintenanceService.createTicket(req.vehicleId, user.getId(), req.description, req.severity);
        return ResponseEntity.ok(t);
    }

    public static class ReportReq {
        public Long vehicleId;
        public String description;
        public String severity;
    }
}
