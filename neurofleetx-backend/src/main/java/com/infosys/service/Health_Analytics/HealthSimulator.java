package com.infosys.service.Health_Analytics;

import com.infosys.model.Health_Analytics.HealthReading;
import com.infosys.model.Vehicle;
import com.infosys.repository.Health_Analytics.HealthReadingRepository;
import com.infosys.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

/*
  Purpose: If no live IoT input exists, this simulator periodically generates health readings
  for each vehicle and triggers the maintenance evaluation logic.
*/
@Component
public class HealthSimulator {

    @Autowired
    private VehicleRepository vehicleRepo;

    @Autowired
    private HealthReadingRepository readingRepo;

    @Autowired
    private MaintenanceService maintenanceService;

    private Random rand = new Random();

    // runs every 30 seconds for demo (tune for production)
    @Scheduled(fixedRate = 30000)
    public void simulate() {
        List<Vehicle> vehicles = vehicleRepo.findAll();
        for (Vehicle v : vehicles) {
            HealthReading r = HealthReading.builder()
                    .vehicleId(v.getId())
                    .engineTemp(70 + rand.nextDouble() * 50) // 70-120C
                    .tireWear(Math.min(100, Math.max(0, (v.getTireWear() != null ? v.getTireWear() : 10) + rand.nextDouble()*2))) // increments
                    .batteryLevel(Math.max(0, (v.getBatteryLevel() != null ? v.getBatteryLevel() : 80) - rand.nextDouble()*1.5))
                    .fuelLevel(Math.max(0, (v.getFuelLevel() != null ? v.getFuelLevel() : 60) - rand.nextDouble()*0.8))
                    .mileage((v.getMileage() != null ? v.getMileage() : 0) + rand.nextDouble() * 5)
                    .timestamp(LocalDateTime.now())
                    .build();
            readingRepo.save(r);

            // update vehicle summary fields (optional)
            v.setBatteryLevel(r.getBatteryLevel());
            v.setFuelLevel(r.getFuelLevel());
            v.setTireWear(r.getTireWear());
            v.setMileage(r.getMileage());
            vehicleRepo.save(v);

            // evaluate for maintenance
            maintenanceService.evaluateHealthForVehicle(v.getId());
        }
    }
}
