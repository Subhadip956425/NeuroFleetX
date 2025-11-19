package com.infosys.repository;

import com.infosys.model.BookingSlot;
import com.infosys.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingSlotRepository extends JpaRepository<BookingSlot, Long> {

    // Find all available slots for a vehicle on a specific date
    @Query("SELECT bs FROM BookingSlot bs WHERE bs.vehicle.id = :vehicleId AND bs.slotDate = :date AND bs.isAvailable = true")
    List<BookingSlot> findAvailableSlotsByVehicleAndDate(
        @Param("vehicleId") Long vehicleId, 
        @Param("date") LocalDate date);

    // Find all available slots for a vehicle within a date range
    @Query("SELECT bs FROM BookingSlot bs WHERE bs.vehicle.id = :vehicleId AND bs.slotDate BETWEEN :startDate AND :endDate AND bs.isAvailable = true")
    List<BookingSlot> findAvailableSlotsByVehicleAndDateRange(
        @Param("vehicleId") Long vehicleId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate);

    // Find slots by vehicle
    @Query("SELECT bs FROM BookingSlot bs WHERE bs.vehicle.id = :vehicleId ORDER BY bs.slotDate, bs.startTime")
    List<BookingSlot> findByVehicle(@Param("vehicleId") Long vehicleId);

    // Find all available slots across all vehicles for a date
    @Query("SELECT bs FROM BookingSlot bs WHERE bs.slotDate = :date AND bs.isAvailable = true ORDER BY bs.vehicle.id, bs.startTime")
    List<BookingSlot> findAvailableSlotsByDate(@Param("date") LocalDate date);
}
