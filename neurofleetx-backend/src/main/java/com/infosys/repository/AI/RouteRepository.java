package com.infosys.repository.AI;

import com.infosys.model.AI.Route;
import com.infosys.model.AI.RouteStatus;
import com.infosys.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RouteRepository extends JpaRepository<Route, Long> {
    // Find all routes by status
    List<Route> findByStatus(RouteStatus status);

    // Find all routes by driver ID
    List<Route> findByDriver_Id(Long driverId);

    // Find all routes by vehicle ID
    List<Route> findByVehicle_Id(Long vehicleId);

    // Find all routes by status and driver ID
    List<Route> findByStatusAndDriver_Id(RouteStatus status, Long driverId);

    // Optional: find by driver entity directly
    List<Route> findByDriver(User driver);
}
