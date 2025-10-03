package com.hepsi.demo.services;

import com.hepsi.demo.dto.LoginRequest;
import com.hepsi.demo.dto.AuthResponse;
import com.hepsi.demo.model.User;
import com.hepsi.demo.repository.UserRepository;
import com.hepsi.demo.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public AuthResponse login(LoginRequest loginRequest) {
        Optional<User> userOptional = userRepository.findByUsername(loginRequest.getUsername());
        if (userOptional.isEmpty()) {
            throw new RuntimeException("Invalid username or password.");
        }

        User user = userOptional.get();

        // ✅ Check password only
        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid username or password.");
        }

        // ✅ Role is taken from DB, not from frontend
        String role = user.getRole().toUpperCase();

        // ✅ Generate JWT with username + role
        String token = jwtUtil.generateToken(user.getUsername(), role);

        return new AuthResponse(token, role);
    }

    @Override
    public User signup(User user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));

        // ✅ Default role = CUSTOMER if not provided
        String role = user.getRole() != null && !user.getRole().isEmpty()
                ? user.getRole().toUpperCase()
                : "CUSTOMER";
        user.setRole(role);

        return userRepository.save(user);
    }
}
