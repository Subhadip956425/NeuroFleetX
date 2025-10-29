package com.infosys.repository;

import com.infosys.model.Vehicle;
import com.infosys.model.VehicleStatus;
import com.infosys.model.VehicleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    List<Vehicle> findByType(VehicleType type);
    List<Vehicle> findByStatus(VehicleStatus status);
    List<Vehicle> findByTypeAndStatus(VehicleType type, VehicleStatus status);

    @Query("SELECT v FROM Vehicle v WHERE v.assignedDriverId = :driverId")
    Optional<Vehicle> findByAssignedDriverId(@Param("driverId") Long driverId);

    @Query("SELECT v FROM Vehicle v WHERE v.assignedDriver.id = :driverId")
    Optional<Vehicle> findVehicleByAssignedDriverId(@Param("driverId") Long driverId);

    @Query("SELECT v FROM Vehicle v WHERE v.assignedDriver IS NOT NULL")
    List<Vehicle> findAllAssignedVehicles();

    // Get unassigned vehicles
    @Query("SELECT v FROM Vehicle v WHERE v.assignedDriver IS NULL")
    List<Vehicle> findAllUnassignedVehicles();
}

