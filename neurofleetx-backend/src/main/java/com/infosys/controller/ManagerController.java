package com.infosys.controller;

import com.infosys.dto.VehicleResponse;
import com.infosys.model.Booking.Booking;
import com.infosys.model.User;
import com.infosys.repository.UserRepository;
import com.infosys.service.Booking.BookingService;
import com.infosys.service.Health_Analytics.MaintenanceService;
import com.infosys.service.VehicleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/manager")
@PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
public class ManagerController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VehicleService vehicleService;

    @Autowired
    private MaintenanceService maintenanceService;

    @Autowired
    private BookingService bookingService;

    // ==================== VEHICLE MANAGEMENT ====================

    @PostMapping("/vehicles/{vehicleId}/assign/{driverId}")
    public ResponseEntity<VehicleResponse> assignDriver(
            @PathVariable Long vehicleId,
            @PathVariable Long driverId) {
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

    // ==================== DRIVER MANAGEMENT ====================

    @GetMapping("/drivers")
    public ResponseEntity<List<User>> listDrivers() {
        List<User> drivers = userRepository.findByRoleName("DRIVER");
        return ResponseEntity.ok(drivers);
    }

    // Get drivers by vehicle type (for booking assignment)
//    @GetMapping("/drivers/by-vehicle-type/{vehicleType}")
//    public ResponseEntity<List<User>> getDriversByVehicleType(@PathVariable String vehicleType) {
//        List<User> drivers = userRepository.findDriversByVehicleType(vehicleType);
//        return ResponseEntity.ok(drivers);
//    }

    // ==================== BOOKING OVERSIGHT ====================

    // Get all bookings for manager oversight
    @GetMapping("/bookings/all")
    public ResponseEntity<List<Booking>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    // Get bookings by status
    @GetMapping("/bookings/status/{status}")
    public ResponseEntity<List<Booking>> getBookingsByStatus(@PathVariable String status) {
        return ResponseEntity.ok(bookingService.getBookingsByStatus(status));
    }

    // Manager reject booking (blocks from driver queue)
    @PutMapping("/bookings/{bookingId}/reject")
    public ResponseEntity<Booking> rejectBooking(
            @PathVariable Long bookingId,
            @RequestBody Map<String, Object> payload) {
        Long managerId = ((Number) payload.get("managerId")).longValue();
        String reason = (String) payload.get("reason");
        Booking booking = bookingService.managerRejectBooking(bookingId, managerId, reason);
        return ResponseEntity.ok(booking);
    }

    // ==================== REPORTS & ANALYTICS ====================

    // Booking statistics for manager dashboard
    @GetMapping("/bookings/stats")
    public ResponseEntity<Map<String, Object>> getBookingStats() {
        return ResponseEntity.ok(bookingService.getBookingStatistics());
    }

    // Export reports (placeholder)
    @GetMapping("/reports/export")
    public ResponseEntity<?> exportPlaceholder() {
        return ResponseEntity.ok("Export scheduled (placeholder)");
    }
}
