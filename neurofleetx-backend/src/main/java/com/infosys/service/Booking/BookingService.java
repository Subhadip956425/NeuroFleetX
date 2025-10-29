package com.infosys.service.Booking;

import com.infosys.dto.CreateBookingRequest;
import com.infosys.model.Booking.Booking;

import java.util.List;
import java.util.Map;

public interface BookingService {
    Booking createBooking(CreateBookingRequest req);
    Booking cancelBooking(Long bookingId, Long customerId);

    // Manager operations
    Booking managerRejectBooking(Long bookingId, Long managerId, String reason);
    List<Booking> getAllBookings();
    List<Booking> getBookingsByStatus(String status);
    Map<String, Object> getBookingStatistics();

    // Driver operations
    List<Booking> getPendingBookingsForDriver(Long driverId);
    List<Booking> getConfirmedBookingsForDriver(Long driverId);
    Booking driverAcceptBooking(Long bookingId, Long driverId);
    Booking driverRejectBooking(Long bookingId, Long driverId, String reason);

    // Customer operations
    List<Booking> getBookingsByCustomer(Long customerId);

    // AI recommendations
    List<Map<String, Object>> getAIRecommendations(
            Long customerId, String vehicleType, Boolean isEv,
            String start, String end, int limit
    );

    // Legacy methods (keep for backward compatibility)
    Booking confirmBooking(Long bookingId, Long managerId); // ✅ KEEP THIS
    List<Booking> getBookingsForVehicle(Long vehicleId); // ✅ KEEP THIS
    List<Booking> getBookingsForDriver(Long driverId); // ✅ KEEP THIS
}
