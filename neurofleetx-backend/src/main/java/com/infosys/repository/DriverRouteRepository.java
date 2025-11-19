package com.infosys.repository;

import com.infosys.model.AI.RouteStatus;
import com.infosys.model.Booking.Booking;
import com.infosys.model.DriverRoute;
import com.infosys.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DriverRouteRepository extends JpaRepository<DriverRoute, Long> {
    // ✅ Find by Booking entity (not bookingId)
    List<DriverRoute> findByBooking(Booking booking);

    // ✅ Find by Driver and status
    List<DriverRoute> findByDriverAndStatus(User driver, String status);

    // ✅ Find by Driver (all routes)
    List<DriverRoute> findByDriver(User driver);

    // ✅ Find by status
    List<DriverRoute> findByStatus(String status);
}
