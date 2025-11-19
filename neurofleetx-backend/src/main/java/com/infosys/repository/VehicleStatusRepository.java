package com.infosys.repository;

import com.infosys.model.VehicleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface VehicleStatusRepository extends JpaRepository<VehicleStatus, Long> {
    Optional<VehicleStatus> findByName(String name);

    @Query("SELECT vs FROM VehicleStatus vs WHERE vs.vehicle.id = :vehicleId")
    Optional<VehicleStatus> findByVehicleId(@Param("vehicleId") Long vehicleId);
}

