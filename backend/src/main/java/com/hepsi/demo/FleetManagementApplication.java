package com.hepsi.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

@EnableMethodSecurity
@SpringBootApplication
public class FleetManagementApplication {
    public static void main(String[] args) {
        SpringApplication.run(FleetManagementApplication.class, args);
    }
}
