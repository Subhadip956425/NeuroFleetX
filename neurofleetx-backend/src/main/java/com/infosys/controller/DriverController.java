package com.infosys.controller;

import com.infosys.model.Booking.Booking;
import com.infosys.model.Health_Analytics.MaintenanceTicket;
import com.infosys.model.User;
import com.infosys.model.Vehicle;
import com.infosys.service.Booking.BookingService;
import com.infosys.service.Health_Analytics.MaintenanceService;
import com.infosys.service.UserService;
import com.infosys.service.VehicleService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/driver")
@PreAuthorize("hasRole('DRIVER')")
public class DriverController {

    private static final Logger logger = LoggerFactory.getLogger(DriverController.class);

    @Autowired
    private BookingService bookingService;

    @Autowired
    private VehicleService vehicleService;

    @Autowired
    private UserService userService;

    @Autowired
    private MaintenanceService maintenanceService;

    // Get driver's assigned vehicle
    @GetMapping("/my-vehicle")
    public ResponseEntity<Vehicle> getMyVehicle() {
        var driver = userService.getCurrentUser(); // from JWT
        Vehicle vehicle = vehicleService.getVehicleByDriverId(driver.getId());
        return ResponseEntity.ok(vehicle);
    }

    // Get pending bookings for driver (based on assigned vehicle type)
    @GetMapping("/{driverId}/bookings/pending")
    public ResponseEntity<List<Booking>> getPendingBookings(@PathVariable Long driverId) {
        List<Booking> bookings = bookingService.getPendingBookingsForDriver(driverId);
        return ResponseEntity.ok(bookings);
    }

    // Get driver's accepted/confirmed bookings
    @GetMapping("/{driverId}/bookings/confirmed")
    public ResponseEntity<List<Booking>> getConfirmedBookings(@PathVariable Long driverId) {
        List<Booking> bookings = bookingService.getConfirmedBookingsForDriver(driverId);
        return ResponseEntity.ok(bookings);
    }

    // Driver accepts a booking
    @PutMapping("/bookings/{bookingId}/accept")
    public ResponseEntity<Booking> acceptBooking(
            @PathVariable Long bookingId,
            @RequestBody Map<String, Long> payload) {
        Long driverId = payload.get("driverId");
        Booking booking = bookingService.driverAcceptBooking(bookingId, driverId);
        return ResponseEntity.ok(booking);
    }

    // Driver rejects a booking
    @PutMapping("/bookings/{bookingId}/reject")
    public ResponseEntity<Booking> rejectBooking(
            @PathVariable Long bookingId,
            @RequestBody Map<String, Object> payload) {
        Long driverId = ((Number) payload.get("driverId")).longValue();
        String reason = (String) payload.get("reason");
        Booking booking = bookingService.driverRejectBooking(bookingId, driverId, reason);
        return ResponseEntity.ok(booking);
    }

    // ✅ New endpoint: get all maintenance tickets for the driver's assigned vehicle
    // ✅ Get all maintenance tickets for driver's vehicle
    @GetMapping("/my-tickets")
    public ResponseEntity<?> getMyTickets() {
        try {
            logger.info("📋 Fetching driver's maintenance tickets...");
            User driver = userService.getCurrentUser();

            logger.info("🔍 Getting vehicle for driver: {}", driver.getId());
            Vehicle vehicle = vehicleService.getVehicleByDriverId(driver.getId());

            if (vehicle == null) {
                logger.warn("⚠️ No vehicle assigned to driver");
                return ResponseEntity.ok(List.of()); // Return empty list
            }

            logger.info("📋 Fetching tickets for vehicle: {}", vehicle.getId());
            List<MaintenanceTicket> tickets = maintenanceService.getTicketsForVehicle(vehicle.getId());

            logger.info("✅ Retrieved {} maintenance tickets", tickets.size());
            return ResponseEntity.ok(tickets);
        } catch (Exception e) {
            logger.error("❌ Error fetching my tickets: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ✅ NEW: Report maintenance issue for driver's vehicle
    @PostMapping("/report-issue")
    public ResponseEntity<?> reportMaintenance(@RequestBody Map<String, Object> payload) {
        try {
            logger.info("🔧 Driver reporting maintenance issue...");
            User driver = userService.getCurrentUser();

            Vehicle vehicle = vehicleService.getVehicleByDriverId(driver.getId());
            if (vehicle == null) {
                logger.warn("⚠️ No vehicle assigned to driver");
                return ResponseEntity.badRequest().body(Map.of("error", "No vehicle assigned"));
            }

            String description = (String) payload.get("description");
            String severity = (String) payload.getOrDefault("severity", "MEDIUM");

            logger.info("🔧 Creating ticket for vehicle {} - Severity: {} - Description: {}",
                    vehicle.getId(), severity, description);

            MaintenanceTicket ticket = maintenanceService.createTicket(
                    vehicle.getId(),
                    driver.getId(),
                    description,
                    severity
            );

            logger.info("✅ Maintenance ticket created: {}", ticket.getId());
            return ResponseEntity.ok(ticket);
        } catch (Exception e) {
            logger.error("❌ Error reporting maintenance: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/assigned-bookings")
    public ResponseEntity<List<Booking>> getAssignedBookings() {
        var driver = userService.getCurrentUser(); // Extracted from JWT
        List<Booking> bookings = bookingService.getBookingsForDriver(driver.getId());
        return ResponseEntity.ok(bookings);
    }

}
