package com.infosys.controller;

import com.infosys.dto.JwtResponse;
import com.infosys.dto.LoginRequest;
import com.infosys.dto.MessageResponse;
import com.infosys.dto.RegisterRequest;
import com.infosys.model.User;
import com.infosys.repository.UserRepository;
import com.infosys.security.jwt.JwtUtils;
import com.infosys.security.services.UserDetailsImpl;
import com.infosys.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    /**
     * Register new user
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Validated @RequestBody RegisterRequest req) {
        try {
            logger.info("📝 Registering new user: {}", req.getEmail());

            User created = userService.registerUser(req);

            logger.info("✅ User registered with ID: {}", created.getId());

            return ResponseEntity.ok(new MessageResponse(
                    "User registered successfully with ID: " + created.getId()
            ));
        } catch (Exception e) {
            logger.error("❌ Registration failed: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Registration failed: " + e.getMessage()));
        }
    }

    /**
     * Authenticate user and return JWT token
     * ✅ FIXED: Roles are cleaned (without ROLE_ prefix)
     */
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginReq) {
        try {
            logger.info("🔐 Login attempt for: {}", loginReq.getEmail());

            // ✅ Authenticate user
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginReq.getEmail(),
                            loginReq.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            logger.info("✅ User authenticated: {}", authentication.getName());

            // ✅ Generate JWT token with roles included
            String jwt = jwtUtils.generateJwtTokenWithRoles(authentication);
            logger.info("✅ JWT token generated");

            // ✅ Get user details
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

            // ✅ Clean roles: remove ROLE_ prefix
            List<String> roles = userDetails.getAuthorities().stream()
                    .map(auth -> auth.getAuthority())
                    .map(role -> role.replace("ROLE_", ""))  // Remove ROLE_ prefix
                    .collect(Collectors.toList());

            logger.info("✅ User roles (cleaned): {}", roles);

            // ✅ Get primary role (first role)
            String primaryRole = roles.isEmpty() ? "USER" : roles.get(0);

            // ✅ Return JWT response with cleaned roles
            JwtResponse response = new JwtResponse(
                    jwt,
                    "Bearer",
                    userDetails.getUsername(),
                    userDetails.getId(),
                    roles,  // ✅ Cleaned roles: ["CUSTOMER"] not ["ROLE_CUSTOMER"]
                    primaryRole  // ✅ Primary role for convenience
            );

            logger.info("✅ Login successful for user: {}", userDetails.getUsername());

            return ResponseEntity.ok(response);

        } catch (BadCredentialsException e) {
            logger.error("❌ Bad credentials for: {}", loginReq.getEmail());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid email or password"));
        } catch (Exception e) {
            logger.error("❌ Login failed: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Login failed: " + e.getMessage()));
        }
    }

    /**
     * Check if user is authenticated
     * ✅ NEW: Verify token is valid
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Not authenticated"));
            }

            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

            List<String> roles = userDetails.getAuthorities().stream()
                    .map(auth -> auth.getAuthority())
                    .map(role -> role.replace("ROLE_", ""))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of(
                    "id", userDetails.getId(),
                    "username", userDetails.getUsername(),
                    "roles", roles
            ));
        } catch (Exception e) {
            logger.error("❌ Error getting current user: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Error retrieving user info"));
        }
    }

    /**
     * Logout endpoint (optional)
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        SecurityContextHolder.clearContext();
        logger.info("✅ User logged out");
        return ResponseEntity.ok(new MessageResponse("Logged out successfully"));
    }

    /**
     * Request password reset (sends email with token)
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");

            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Email is required"));
            }

            logger.info("🔑 Password reset requested for: {}", email);

            userService.createPasswordResetToken(email);

            return ResponseEntity.ok(Map.of(
                    "message", "If an account exists with this email, a password reset link has been sent.",
                    "success", true
            ));

        } catch (RuntimeException e) {
            logger.error("❌ Password reset failed: {}", e.getMessage());
            // ✅ Don't reveal if user exists or not (security best practice)
            return ResponseEntity.ok(Map.of(
                    "message", "If an account exists with this email, a password reset link has been sent.",
                    "success", true
            ));
        } catch (Exception e) {
            logger.error("❌ Unexpected error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "An error occurred. Please try again later."));
        }
    }

    /**
     * Verify reset token is valid
     */
    @GetMapping("/verify-reset-token")
    public ResponseEntity<?> verifyResetToken(@RequestParam String token) {
        try {
            boolean isValid = userService.verifyResetToken(token);

            if (isValid) {
                return ResponseEntity.ok(Map.of(
                        "valid", true,
                        "message", "Token is valid"
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                        "valid", false,
                        "message", "Invalid or expired token"
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "valid", false,
                    "message", "Invalid token"
            ));
        }
    }

    /**
     * Reset password using token
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        try {
            String token = request.get("token");
            String newPassword = request.get("newPassword");

            if (token == null || newPassword == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Token and new password are required"));
            }

            if (newPassword.length() < 6) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Password must be at least 6 characters long"));
            }

            logger.info("🔐 Password reset attempt with token: {}", token);

            userService.resetPassword(token, newPassword);

            logger.info("✅ Password reset successful");

            return ResponseEntity.ok(Map.of(
                    "message", "Password has been reset successfully!",
                    "success", true
            ));

        } catch (RuntimeException e) {
            logger.error("❌ Password reset failed: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            logger.error("❌ Unexpected error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "An error occurred. Please try again later."));
        }
    }

}
