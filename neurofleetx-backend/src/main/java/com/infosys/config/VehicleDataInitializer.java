package com.infosys.config;

import com.infosys.model.VehicleStatus;
import com.infosys.model.VehicleType;
import com.infosys.repository.VehicleStatusRepository;
import com.infosys.repository.VehicleTypeRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class VehicleDataInitializer {

    @Bean
    CommandLineRunner initVehicleData(VehicleTypeRepository typeRepo, VehicleStatusRepository statusRepo) {
        return args -> {
            List<String> types = List.of("Car", "Van", "Truck", "EV", "Bike");
            for (String t : types) {
                typeRepo.findByName(t).orElseGet(() -> typeRepo.save(new VehicleType(null, t)));
            }

            List<String> statuses = List.of("Available", "In Use", "Needs Maintenance", "Offline");
            for (String s : statuses) {
                statusRepo.findByName(s).orElseGet(() -> statusRepo.save(new VehicleStatus(null, s)));
            }
        };
    }
}

