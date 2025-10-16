package com.infosys.controller;

import com.infosys.dto.BookingDto;
import com.infosys.model.Booking;
import com.infosys.model.User;
import com.infosys.repository.UserRepository;
import com.infosys.repository.VehicleRepository;
import com.infosys.service.BookingService;
import com.infosys.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customer/bookings")
public class CustomerBookingController {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private UserService userService;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private UserRepository userRepository;

    // Create a new booking
    @PreAuthorize("hasRole('CUSTOMER')")
    @PostMapping
    public Booking createBooking(@RequestBody BookingDto bookingDto) {
        Booking booking = Booking.builder()
                .customer(userRepository.findById(bookingDto.getCustomerId()).orElseThrow())
                .vehicle(vehicleRepository.findById(bookingDto.getVehicleId()).orElseThrow())
                .pickupLocation(bookingDto.getPickupLocation())
                .dropLocation(bookingDto.getDropoffLocation())
                .startTime(bookingDto.getStartTime()) // must parse ISO string to LocalDateTime
                .endTime(bookingDto.getEndTime())
                .status("BOOKED")
                .price(bookingDto.getPrice())
                .build();

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
