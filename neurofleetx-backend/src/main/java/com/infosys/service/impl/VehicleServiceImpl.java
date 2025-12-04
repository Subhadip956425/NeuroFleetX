package com.infosys.service.impl;

import com.infosys.dto.VehicleRequest;
import com.infosys.dto.VehicleResponse;
import com.infosys.model.User;
import com.infosys.model.Vehicle;
import com.infosys.model.VehicleStatus;
import com.infosys.model.VehicleType;
import com.infosys.repository.*;
import com.infosys.repository.AI.RouteRepository;
import com.infosys.repository.Health_Analytics.MaintenanceTicketRepository;
import com.infosys.service.VehicleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class VehicleServiceImpl implements VehicleService {

    private static final Logger logger = LoggerFactory.getLogger(VehicleServiceImpl.class);

    @Autowired
    private VehicleRepository vehicleRepo;
    @Autowired
    private VehicleTypeRepository typeRepo;
    @Autowired
    private VehicleStatusRepository statusRepo;
    @Autowired
    private UserRepository userRepo;
    @Autowired
    private MaintenanceTicketRepository maintenanceTicketRepo;
    @Autowired
    private BookingRepository bookingRepo;
    @Autowired
    private RouteRepository routeRepo;

    @Override
    public VehicleResponse createVehicle(VehicleRequest req) {
        Vehicle vehicle = new Vehicle();
        vehicle.setName(req.getName());

        VehicleType type = typeRepo.findById(req.getTypeId())
                .orElseThrow(() -> new RuntimeException("Vehicle type not found"));
        vehicle.setType(type);

        VehicleStatus status = statusRepo.findById(req.getStatusId())
                .orElseThrow(() -> new RuntimeException("Vehicle status not found"));
        vehicle.setStatus(status);

        if (req.getAssignedDriverId() != null) {
            User driver = userRepo.findById(req.getAssignedDriverId())
                    .orElseThrow(() -> new RuntimeException("Driver not found"));
            vehicle.setAssignedDriver(driver);
        }

        vehicle.setBatteryLevel(req.getBatteryLevel() != null ? req.getBatteryLevel() : 100);
        vehicle.setFuelLevel(req.getFuelLevel() != null ? req.getFuelLevel() : 100);
        vehicle.setSpeed(req.getSpeed() != null ? req.getSpeed() : 0);
        vehicle.setLatitude(req.getLatitude() != null ? req.getLatitude() : 0);
        vehicle.setLongitude(req.getLongitude() != null ? req.getLongitude() : 0);
        vehicle.setLastUpdated(LocalDateTime.now());

        vehicleRepo.save(vehicle);
        return mapToResponse(vehicle);
    }

    @Override
    public VehicleResponse updateVehicle(Long id, VehicleRequest req) {
        Vehicle vehicle = vehicleRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        if (req.getName() != null) vehicle.setName(req.getName());
        if (req.getTypeId() != null)
            vehicle.setType(typeRepo.findById(req.getTypeId())
                    .orElseThrow(() -> new RuntimeException("Vehicle type not found")));
        if (req.getStatusId() != null)
            vehicle.setStatus(statusRepo.findById(req.getStatusId())
                    .orElseThrow(() -> new RuntimeException("Vehicle status not found")));

        if (req.getAssignedDriverId() != null) {
            User driver = userRepo.findById(req.getAssignedDriverId())
                    .orElseThrow(() -> new RuntimeException("Driver not found"));
            vehicle.setAssignedDriver(driver);
        }

        if (req.getBatteryLevel() != null) vehicle.setBatteryLevel(req.getBatteryLevel());
        if (req.getFuelLevel() != null) vehicle.setFuelLevel(req.getFuelLevel());
        if (req.getSpeed() != null) vehicle.setSpeed(req.getSpeed());
        if (req.getLatitude() != null) vehicle.setLatitude(req.getLatitude());
        if (req.getLongitude() != null) vehicle.setLongitude(req.getLongitude());

        vehicle.setLastUpdated(LocalDateTime.now());
        vehicleRepo.save(vehicle);
        return mapToResponse(vehicle);
    }


    @Override
    @Transactional
    public void deleteVehicle(Long id) {
        logger.info("🗑️ Attempting to delete vehicle with ID: {}", id);

        // Check if vehicle exists
        Vehicle vehicle = vehicleRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with ID: " + id));

        try {
            // Step 1: Delete maintenance tickets
            logger.info("   🔧 Deleting maintenance tickets for vehicle {}", id);
            int ticketsDeleted = maintenanceTicketRepo.deleteByVehicleId(id);
            logger.info("   ✅ Deleted {} maintenance tickets", ticketsDeleted);

            // Step 2: Delete bookings
            logger.info("   📅 Deleting bookings for vehicle {}", id);
            int bookingsDeleted = bookingRepo.deleteByVehicleId(id);
            logger.info("   ✅ Deleted {} bookings", bookingsDeleted);

            // Step 3: Delete routes
            logger.info("   🗺️ Deleting routes for vehicle {}", id);
            int routesDeleted = routeRepo.deleteByVehicleId(id);
            logger.info("   ✅ Deleted {} routes", routesDeleted);

            // Step 4: Clear assigned driver
            if (vehicle.getAssignedDriver() != null) {
                logger.info("   👤 Clearing assigned driver: {}", vehicle.getAssignedDriver().getId());
                vehicle.setAssignedDriver(null);
                vehicleRepo.save(vehicle);
            }

            // Step 5: Finally delete the vehicle
            logger.info("   🚗 Deleting vehicle {}", id);
            vehicleRepo.deleteById(id);

            logger.info("✅ Successfully deleted vehicle {} and all related data", id);

        } catch (Exception e) {
            logger.error("❌ Error deleting vehicle {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Failed to delete vehicle: " + e.getMessage());
        }
    }

    @Override
    public VehicleResponse getVehicle(Long id) {
        Vehicle v = vehicleRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));
        return mapToResponse(v);
    }

    @Override
    public List<VehicleResponse> listVehicles() {
        return vehicleRepo.findAll().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public List<VehicleResponse> filterVehicles(Long typeId, Long statusId) {
        if (typeId != null && statusId != null) {
            VehicleType type = typeRepo.findById(typeId).orElseThrow(() -> new RuntimeException("Type not found"));
            VehicleStatus status = statusRepo.findById(statusId).orElseThrow(() -> new RuntimeException("Status not found"));
            return vehicleRepo.findByTypeAndStatus(type, status).stream().map(this::mapToResponse).collect(Collectors.toList());
        } else if (typeId != null) {
            VehicleType type = typeRepo.findById(typeId).orElseThrow(() -> new RuntimeException("Type not found"));
            return vehicleRepo.findByType(type).stream().map(this::mapToResponse).collect(Collectors.toList());
        } else if (statusId != null) {
            VehicleStatus status = statusRepo.findById(statusId).orElseThrow(() -> new RuntimeException("Status not found"));
            return vehicleRepo.findByStatus(status).stream().map(this::mapToResponse).collect(Collectors.toList());
        } else {
            return listVehicles();
        }
    }

    @Override
    @Transactional(readOnly = true)
    public VehicleResponse updateTelemetry(Long vehicleId, Double speed, Double battery, Double fuel, Double latitude, Double longitude) {
        Vehicle vehicle = vehicleRepo.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        if (speed != null) vehicle.setSpeed(speed);
        if (battery != null) vehicle.setBatteryLevel(battery);
        if (fuel != null) vehicle.setFuelLevel(fuel);
        if (latitude != null) vehicle.setLatitude(latitude);
        if (longitude != null) vehicle.setLongitude(longitude);

        vehicle.setLastUpdated(LocalDateTime.now());


        if (vehicle.getBatteryLevel() < 20 || vehicle.getFuelLevel() < 10) {
            VehicleStatus needsService = statusRepo.findByName("Needs Maintenance")
                    .orElseThrow(() -> new RuntimeException("Status not found"));
            vehicle.setStatus(needsService);
        }

        vehicleRepo.save(vehicle);
        return mapToResponse(vehicle);
    }

    @Override
    public VehicleResponse assignDriver(Long vehicleId, Long driverId) {
        Vehicle vehicle = vehicleRepo.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));
        User driver = userRepo.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found"));

        // ensure user has DRIVER role
        boolean isDriver = driver.getRoles().stream()
                .anyMatch(r -> "DRIVER".equalsIgnoreCase(r.getName()));
        if (!isDriver) throw new RuntimeException("User is not a DRIVER");

        // ✅ SET BOTH - the ID field AND the relationship
        vehicle.setAssignedDriverId(driver.getId());  // ✅ ADD THIS LINE
        vehicle.setAssignedDriver(driver);

        // Update status to "In Use" when driver assigned
        VehicleStatus inUseStatus = statusRepo.findByName("In Use")
                .orElseThrow(() -> new RuntimeException("Status not found"));
        vehicle.setStatus(inUseStatus);

        vehicle.setLastUpdated(LocalDateTime.now());
        vehicleRepo.save(vehicle);

        return mapToResponse(vehicle);
    }

    @Override
    public VehicleResponse unassignDriver(Long vehicleId) {
        Vehicle vehicle = vehicleRepo.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        // ✅ CLEAR BOTH - the ID field AND the relationship
        vehicle.setAssignedDriverId(null);  // ✅ ADD THIS LINE
        vehicle.setAssignedDriver(null);

        // Update status back to "Available" when driver unassigned
        VehicleStatus availableStatus = statusRepo.findByName("Available")
                .orElseThrow(() -> new RuntimeException("Status not found"));
        vehicle.setStatus(availableStatus);

        vehicle.setLastUpdated(LocalDateTime.now());
        vehicleRepo.save(vehicle);

        return mapToResponse(vehicle);
    }


    private VehicleResponse mapToResponse(Vehicle v) {
        VehicleResponse resp = new VehicleResponse();
        resp.setId(v.getId());
        resp.setName(v.getName());
        resp.setType(v.getType().getName());
        resp.setStatus(v.getStatus().getName());
        resp.setBatteryLevel(v.getBatteryLevel());
        resp.setFuelLevel(v.getFuelLevel());
        resp.setSpeed(v.getSpeed());
        resp.setLatitude(v.getLatitude());
        resp.setLongitude(v.getLongitude());

        // ✅ CORRECT: Only set if driver exists
        if (v.getAssignedDriver() != null) {
            resp.setAssignedDriverId(v.getAssignedDriver().getId());
            // Don't set assignedDriverName to null - leave it as is or just don't set it
        }

        return resp;
    }



    @Override
    public Vehicle getVehicleByDriverId(Long driverId) {
        return vehicleRepo.findByAssignedDriverId(driverId)
                .orElseThrow(() -> new RuntimeException("No vehicle assigned to driver with ID: " + driverId));
    }

}
