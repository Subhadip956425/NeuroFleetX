package com.infosys.service;

import com.infosys.model.Booking;
import com.infosys.model.User;

import java.util.List;

public interface BookingService {

    Booking createBooking(Booking booking);

    Booking updateBooking(Long bookingId, Booking booking);

    void cancelBooking(Long bookingId);

    Booking getBooking(Long bookingId);

    List<Booking> getCustomerBookings(User customer);

    List<Booking> getAllBookings(); // Admin/Manager
}
