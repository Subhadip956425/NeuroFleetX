package com.infosys.controller;

import com.infosys.model.Booking;
import com.infosys.model.User;
import com.infosys.service.BookingService;
import com.infosys.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class CustomerBookingController {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private UserService userService;

    // Create a new booking
    @PreAuthorize("hasRole('CUSTOMER')")
    @PostMapping
    public Booking createBooking(@RequestBody Booking booking) {
        User customer = userService.getCurrentUser();
        booking.setCustomer(customer);
        return bookingService.createBooking(booking);
    }

    // Update booking (only before started)
    @PreAuthorize("hasRole('CUSTOMER')")
    @PutMapping("/{id}")
    public Booking updateBooking(@PathVariable Long id, @RequestBody Booking booking) {
        return bookingService.updateBooking(id, booking);
    }

    // Cancel booking
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('MANAGER') or hasRole('ADMIN')")
    @PutMapping("/{id}/cancel")
    public void cancelBooking(@PathVariable Long id) {
        bookingService.cancelBooking(id);
    }

    // Get own bookings (customer)
    @PreAuthorize("hasRole('CUSTOMER')")
    @GetMapping("/me")
    public List<Booking> getMyBookings() {
        User customer = userService.getCurrentUser();
        return bookingService.getCustomerBookings(customer);
    }

    // Admin/Manager can view all bookings
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    @GetMapping
    public List<Booking> getAllBookings() {
        return bookingService.getAllBookings();
    }
}
