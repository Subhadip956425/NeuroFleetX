package com.infosys.config;

import com.infosys.model.Role;
import com.infosys.model.User;
import com.infosys.repository.RoleRepository;
import com.infosys.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.*;

@Configuration
public class RoleDataInitializer {

    @Bean
    CommandLineRunner initRoles(RoleRepository roleRepository,
                                UserRepository userRepository,
                                PasswordEncoder encoder) {
        return args -> {
            List<String> roles = List.of("ADMIN", "MANAGER", "DRIVER", "CUSTOMER");
            for (String r : roles) {
                roleRepository.findByName(r).orElseGet(() -> roleRepository.save(new Role(null, r)));
            }

            // create default admin if not exists
            String adminEmail = "admin@neurofleetx.com";
            if (userRepository.findByEmail(adminEmail).isEmpty()) {
                Role adminRole = roleRepository.findByName("ADMIN").get();
                User admin = new User();
                admin.setEmail(adminEmail);
                admin.setFullName("NeuroFleetX Admin");
                admin.setPassword(encoder.encode("Admin@123")); 
                admin.setRoles(new HashSet<>(Collections.singletonList(adminRole)));
                userRepository.save(admin);
                System.out.println("Default admin created: " + adminEmail + " / Admin@123");
            }
        };
    }
}
