// backend/src/main/java/com/hepsi/demo/repository/UserRepository.java
package com.hepsi.demo.repository;

import com.hepsi.demo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
}
