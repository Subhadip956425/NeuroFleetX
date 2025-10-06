package com.infosys.service.impl;

import com.infosys.model.Booking;
import com.infosys.model.User;
import com.infosys.repository.BookingRepository;
import com.infosys.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class BookingServiceImpl implements BookingService {

    @Autowired
    private BookingRepository bookingRepo;

    @Override
    public Booking createBooking(Booking booking) {
        booking.setStatus("BOOKED");
        return bookingRepo.save(booking);
    }

    @Override
    public Booking updateBooking(Long bookingId, Booking booking) {
        Booking existing = bookingRepo.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        existing.setStartTime(booking.getStartTime());
        existing.setEndTime(booking.getEndTime());
        existing.setPickupLocation(booking.getPickupLocation());
        existing.setDropLocation(booking.getDropLocation());
        existing.setPrice(booking.getPrice());
        return bookingRepo.save(existing);
    }

    @Override
    public void cancelBooking(Long bookingId) {
        Booking booking = bookingRepo.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        booking.setStatus("CANCELLED");
        bookingRepo.save(booking);
    }

    @Override
    public Booking getBooking(Long bookingId) {
        return bookingRepo.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
    }

    @Override
    public List<Booking> getCustomerBookings(User customer) {
        return bookingRepo.findByCustomer(customer);
    }

    @Override
    public List<Booking> getAllBookings() {
        return bookingRepo.findAll();
    }
}
