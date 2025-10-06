package com.infosys.service.impl;

import com.infosys.model.Vehicle;
import com.infosys.dto.VehicleResponse;
import com.infosys.repository.VehicleRepository;
import com.infosys.service.VehicleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Random;

@Component
public class TelemetrySimulator {

    @Autowired
    private VehicleRepository vehicleRepo;

    @Autowired
    private VehicleService vehicleService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private Random random = new Random();

    // Runs every 10 seconds
    @Scheduled(fixedRate = 10000)
    public void simulateTelemetry() {
        List<Vehicle> vehicles = vehicleRepo.findAll();
        for (Vehicle v : vehicles) {
            double newSpeed = random.nextDouble() * 120; // km/h
            double newBattery = Math.max(0, v.getBatteryLevel() - random.nextDouble() * 5);
            double newFuel = Math.max(0, v.getFuelLevel() - random.nextDouble() * 3);
            double newLat = v.getLatitude() + (random.nextDouble() - 0.5) * 0.001;
            double newLon = v.getLongitude() + (random.nextDouble() - 0.5) * 0.001;

            VehicleResponse updated = vehicleService.updateTelemetry(v.getId(), newSpeed, newBattery, newFuel, newLat, newLon);

            // Broadcast to clients
            messagingTemplate.convertAndSend("/topic/telemetry", updated);
        }
    }
}
