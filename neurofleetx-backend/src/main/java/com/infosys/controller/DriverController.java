package com.infosys.controller;

import com.infosys.model.Booking.Booking;
import com.infosys.model.Health_Analytics.MaintenanceTicket;
import com.infosys.model.Vehicle;
import com.infosys.service.Booking.BookingService;
import com.infosys.service.Health_Analytics.MaintenanceService;
import com.infosys.service.UserService;
import com.infosys.service.VehicleService;
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
    @GetMapping("/my-tickets")
    public ResponseEntity<List<MaintenanceTicket>> getMyTickets() {
        var driver = userService.getCurrentUser();
        var vehicle = vehicleService.getVehicleByDriverId(driver.getId());
        if (vehicle == null) {
            return ResponseEntity.notFound().build();
        }

        var tickets = maintenanceService.getTicketsForVehicle(vehicle.getId());
        return ResponseEntity.ok(tickets);
    }

    @GetMapping("/assigned-bookings")
    public ResponseEntity<List<Booking>> getAssignedBookings() {
        var driver = userService.getCurrentUser(); // Extracted from JWT
        List<Booking> bookings = bookingService.getBookingsForDriver(driver.getId());
        return ResponseEntity.ok(bookings);
    }

}
