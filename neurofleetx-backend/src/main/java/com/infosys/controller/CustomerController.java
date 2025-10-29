package com.infosys.controller;

import com.infosys.model.Booking.Booking;
import com.infosys.model.User;
import com.infosys.service.Booking.BookingService;
import com.infosys.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/customer/bookings")
@PreAuthorize("hasRole('CUSTOMER')")
public class CustomerController {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private UserService userService;

    @GetMapping("/me")
    public ResponseEntity<List<Booking>> getMyBookings() {
        User user = userService.getCurrentUser();  // fetch authenticated User
        Long customerId = user.getId();
        return ResponseEntity.ok(bookingService.getBookingsByCustomer(customerId));
    }

}
