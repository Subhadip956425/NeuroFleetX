package com.infosys.controller.Booking;

import com.infosys.dto.CreateBookingRequest;
import com.infosys.dto.RejectBookingRequest;
import com.infosys.model.Booking.Booking;
import com.infosys.service.Booking.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/*
 Purpose: Booking endpoints for Customer, Manager, Admin, and Driver roles.
 Workflow:
 1. Customer creates booking → PENDING status
 2. Manager can REJECT (blocks drivers) → REJECTED status
 3. Driver (with matching vehicle type) can ACCEPT → CONFIRMED status
 4. Driver can REJECT (offers to other drivers) → stays PENDING or REJECTED
*/
@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "*")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    // ==================== CUSTOMER ENDPOINTS ====================

    // Customer creates booking → status: PENDING
    @PostMapping("/create")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Booking> createBooking(@RequestBody CreateBookingRequest req) {
        Booking b = bookingService.createBooking(req);
        // Booking is automatically visible to Manager and eligible Drivers
        return ResponseEntity.ok(b);
    }

    // Customer cancels own booking
    @PutMapping("/cancel/{bookingId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Booking> cancelBooking(
            @PathVariable Long bookingId,
            @RequestParam Long customerId) {
        Booking b = bookingService.cancelBooking(bookingId, customerId);
        return ResponseEntity.ok(b);
    }

    // Customer views their bookings
    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<List<Booking>> getCustomerBookings(@PathVariable Long customerId) {
        return ResponseEntity.ok(bookingService.getBookingsByCustomer(customerId));
    }

    // ==================== MANAGER ENDPOINTS ====================

    // Manager views ALL bookings (oversight)
    @GetMapping("/manager/all")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<Booking>> getAllBookingsForManager() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    // Manager REJECTS booking (prevents driver assignment)
    @PutMapping("/manager/{bookingId}/reject")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Booking> managerRejectBooking(
            @PathVariable Long bookingId,
            @RequestBody RejectBookingRequest request) {
        Booking b = bookingService.managerRejectBooking(
                bookingId,
                request.getManagerId(),
                request.getReason()
        );
        return ResponseEntity.ok(b);
    }

    // ==================== DRIVER ENDPOINTS ====================

    // Driver gets bookings for their assigned vehicle types (PENDING only, not rejected by manager)
    @GetMapping("/driver/{driverId}/pending")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<List<Booking>> getDriverPendingBookings(@PathVariable Long driverId) {
        List<Booking> bookings = bookingService.getPendingBookingsForDriver(driverId);
        return ResponseEntity.ok(bookings);
    }

    // Driver ACCEPTS booking → status: CONFIRMED, assigns driver
    @PutMapping("/driver/{bookingId}/accept")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<Booking> driverAcceptBooking(
            @PathVariable Long bookingId,
            @RequestBody Map<String, Long> payload) {
        Long driverId = payload.get("driverId");
        Booking b = bookingService.driverAcceptBooking(bookingId, driverId);
        return ResponseEntity.ok(b);
    }

    // Driver REJECTS booking → stays PENDING for other drivers
    @PutMapping("/driver/{bookingId}/reject")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<Booking> driverRejectBooking(
            @PathVariable Long bookingId,
            @RequestBody RejectBookingRequest request) {
        Booking b = bookingService.driverRejectBooking(
                bookingId,
                request.getDriverId(),
                request.getReason()
        );
        return ResponseEntity.ok(b);
    }

    // ==================== ADMIN ENDPOINTS ====================

    // Admin views all bookings (full oversight)
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Booking>> getAllBookingsForAdmin() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    // ==================== AI RECOMMENDATION ENDPOINT ====================

    // AI-powered vehicle recommendations for customer
    @GetMapping("/recommendations")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<Map<String, Object>>> getRecommendations(
            @RequestParam Long customerId,
            @RequestParam(required = false) String vehicleType,
            @RequestParam(required = false) Boolean isEv,
            @RequestParam String start,
            @RequestParam String end,
            @RequestParam(defaultValue = "5") int limit) {
        List<Map<String, Object>> recommendations = bookingService.getAIRecommendations(
                customerId, vehicleType, isEv, start, end, limit
        );
        return ResponseEntity.ok(recommendations);
    }
}
