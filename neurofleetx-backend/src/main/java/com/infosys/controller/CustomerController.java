package com.infosys.controller;

import com.infosys.config.BookingMapper;
import com.infosys.dto.BookingResponse;
import com.infosys.model.Booking.Booking;
import com.infosys.model.User;
import com.infosys.service.Booking.BookingService;
import com.infosys.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customer")
@CrossOrigin(origins = "*")
public class CustomerController {

    private static final Logger logger = LoggerFactory.getLogger(CustomerController.class);

    @Autowired
    private UserService userService;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private BookingMapper bookingMapper;

    /**
     * Get current customer's bookings (using JWT)
     */
    @GetMapping("/bookings/me")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> getMyBookings() {
        try {
            User customer = userService.getCurrentUser();
            logger.info("📋 Fetching bookings for customer {}", customer.getId());

            List<Booking> bookings = bookingService.getBookingsByCustomer(customer.getId());
            List<BookingResponse> dtos = bookingMapper.toDtoList(bookings);

            logger.info("✅ Retrieved {} bookings", dtos.size());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            logger.error("❌ Error fetching bookings: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get current customer profile
     */
    @GetMapping("/profile")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> getProfile() {
        try {
            User customer = userService.getCurrentUser();

            Map<String, Object> profile = new HashMap<>();
            profile.put("id", customer.getId());
            profile.put("email", customer.getEmail());
            profile.put("fullName", customer.getFullName());
            profile.put("roles", customer.getRoles());
//            profile.put("createdAt", customer.getCreatedAt());

            logger.info("✅ Retrieved profile for customer {}", customer.getId());
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            logger.error("❌ Error fetching profile: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

}
