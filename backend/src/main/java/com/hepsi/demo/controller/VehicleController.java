package com.hepsi.demo.controller;

import com.hepsi.demo.model.Vehicle;
import com.hepsi.demo.services.VehicleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/vehicles")
@CrossOrigin(origins = "http://localhost:5173")
public class VehicleController {

    private final VehicleService vehicleService;

    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    // ✅ Add vehicle
    @PostMapping("/add")
    public ResponseEntity<Vehicle> addVehicle(@RequestBody Vehicle vehicle) {
        return ResponseEntity.ok(vehicleService.addVehicle(vehicle));
    }

    // ✅ Get all vehicles
    @GetMapping("/all")
    public ResponseEntity<List<Vehicle>> getAllVehicles() {
        return ResponseEntity.ok(vehicleService.getAllVehicles());
    }

    // ✅ Update vehicle
    @PutMapping("/update/{id}")
    public ResponseEntity<Vehicle> updateVehicle(@PathVariable Long id, @RequestBody Vehicle updatedVehicle) {
        Vehicle updated = vehicleService.updateVehicle(id, updatedVehicle);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    // ✅ Delete vehicle
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteVehicle(@PathVariable Long id) {
        boolean deleted = vehicleService.deleteVehicle(id);
        return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}
