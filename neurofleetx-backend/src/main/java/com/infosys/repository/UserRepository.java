package com.infosys.repository;


import com.infosys.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Boolean existsByEmail(String email);

    // Find users by role name (corrected to use roles Set)
    @Query("SELECT u FROM User u JOIN u.roles r WHERE r.name = :roleName")
    List<User> findByRoleName(@Param("roleName") String roleName);

    // Simple approach: Get all drivers, filter in service layer
    @Query("SELECT u FROM User u JOIN u.roles r WHERE r.name = 'DRIVER'")
    List<User> findAllDrivers();
}

