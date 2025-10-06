package com.infosys.controller;

import com.infosys.dto.VehicleResponse;
import com.infosys.service.MaintenanceService;
import com.infosys.service.VehicleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/manager")
@PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
public class ManagerController {

    @Autowired
    private VehicleService vehicleService;

    @Autowired
    private MaintenanceService maintenanceService;

    @PostMapping("/vehicles/{vehicleId}/assign/{driverId}")
    public ResponseEntity<VehicleResponse> assignDriver(@PathVariable Long vehicleId, @PathVariable Long driverId) {
        return ResponseEntity.ok(vehicleService.assignDriver(vehicleId, driverId));
    }

    @PostMapping("/vehicles/{vehicleId}/unassign")
    public ResponseEntity<VehicleResponse> unassignDriver(@PathVariable Long vehicleId) {
        return ResponseEntity.ok(vehicleService.unassignDriver(vehicleId));
    }

    @GetMapping("/vehicles")
    public ResponseEntity<List<VehicleResponse>> listVehicles() {
        return ResponseEntity.ok(vehicleService.listVehicles());
    }

    // placeholder for export
    @GetMapping("/reports/export")
    public ResponseEntity<?> exportPlaceholder() {
        return ResponseEntity.ok("Export scheduled (placeholder)");
    }
}
