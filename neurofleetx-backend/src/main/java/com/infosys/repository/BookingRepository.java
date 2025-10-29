package com.infosys.repository;

import com.infosys.model.Booking.Booking;
import com.infosys.model.Booking.BookingStatus;
import com.infosys.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {


    List<Booking> findByCustomerId(Long customerId);

    // Find bookings that overlap with a candidate time window for a given vehicle
    @Query("SELECT b FROM Booking b WHERE b.vehicleId = :vehicleId AND b.status = 'CONFIRMED' AND NOT (b.endTime <= :start OR b.startTime >= :end)")
    List<Booking> findOverlappingConfirmed(@Param("vehicleId") Long vehicleId,
                                           @Param("start") LocalDateTime start,
                                           @Param("end") LocalDateTime end);

    // Find confirmed bookings that overlap any vehicle (for checking availability across vehicles)
    @Query("SELECT b FROM Booking b WHERE b.status = 'CONFIRMED' AND NOT (b.endTime <= :start OR b.startTime >= :end)")
    List<Booking> findOverlappingAny(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT v FROM Vehicle v WHERE v.assignedDriverId = :driverId")
    Optional<Vehicle> findByAssignedDriverId(@Param("driverId") Long driverId);

    // ✅ ADD THIS
    @Query("SELECT b FROM Booking b WHERE b.status = :status")
    List<Booking> findByStatus(@Param("status") BookingStatus status);

    // ✅ ADD THIS
    @Query("SELECT b FROM Booking b WHERE b.assignedDriverId = :driverId")
    List<Booking> findByDriverId(@Param("driverId") Long driverId);

}
