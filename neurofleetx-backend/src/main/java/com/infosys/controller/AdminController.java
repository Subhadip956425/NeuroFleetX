package com.infosys.controller;

import com.infosys.dto.MessageResponse;
import com.infosys.model.Role;
import com.infosys.model.User;
import com.infosys.repository.RoleRepository;
import com.infosys.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private RoleRepository roleRepository;

    // list all users
    @GetMapping("/users")
    public ResponseEntity<List<User>> listDrivers() {
        List<User> drivers = userRepository.findByRoleName("DRIVER");
        return ResponseEntity.ok(drivers);
    }

    // change user's role
    @PostMapping("/users/{id}/role")
    public ResponseEntity<?> changeUserRole(@PathVariable Long id, @RequestBody RoleChangeRequest req) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        Role r = roleRepository.findByName(req.roleName).orElseThrow(() -> new RuntimeException("Role not found"));
        user.setRoles(java.util.Set.of(r));
        userRepository.save(user);
        return ResponseEntity.ok(new MessageResponse("Role updated"));
    }

    public static class RoleChangeRequest {
        public String roleName;
    }
}
