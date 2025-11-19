package com.infosys.service;

import com.infosys.dto.RegisterRequest;
import com.infosys.model.PasswordResetToken;
import com.infosys.model.Role;
import com.infosys.model.User;
import com.infosys.repository.PasswordResetTokenRepository;
import com.infosys.repository.RoleRepository;
import com.infosys.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder encoder;

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    @Autowired
    private EmailService emailService;

    @Value("${password.reset.token.expiry:3600000}") // Default 1 hour
    private Long tokenExpiryMs;

    @Value("${app.url:http://localhost:5173}")
    private String appUrl;

    /**
     * Register new user and send welcome email
     */
    @Transactional
    public User registerUser(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email is already taken.");
        }

        User user = new User();
        user.setEmail(req.getEmail());
        user.setFullName(req.getFullName());
        user.setPassword(encoder.encode(req.getPassword()));

        // Assign role (if missing, default to CUSTOMER)
        String roleName = Optional.ofNullable(req.getRole()).orElse("CUSTOMER");
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));

        user.setRoles(new HashSet<>(Collections.singletonList(role)));
        User savedUser = userRepository.save(user);

        // ✅ Send welcome email
        try {
            emailService.sendWelcomeEmail(user.getEmail(), user.getFullName());
            System.out.println("✅ Welcome email sent to: " + user.getEmail());
        } catch (Exception e) {
            System.err.println("❌ Failed to send welcome email: " + e.getMessage());
            // Don't fail registration if email fails
        }

        return savedUser;
    }

    /**
     * Get currently authenticated user
     */
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("No authenticated user found");
        }
        String email = authentication.getName(); // email from JWT or login
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
    }

    /**
     * Create password reset token and send email
     */
    @Transactional
    public String createPasswordResetToken(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        // Delete any existing tokens for this user
        tokenRepository.deleteByUser(user);

        // Generate random 6-digit code
        String token = String.format("%06d", new Random().nextInt(999999));

        LocalDateTime expiryDate = LocalDateTime.now().plusSeconds(tokenExpiryMs / 1000);

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiryDate(expiryDate)
                .used(false)
                .build();

        tokenRepository.save(resetToken);

        // Send email
        String resetUrl = appUrl + "/reset-password?token=" + token;
        emailService.sendPasswordResetEmail(user.getEmail(), user.getFullName(), token, resetUrl);

        System.out.println("✅ Password reset token created for: " + email);
        return token;
    }

    /**
     * Validate and use password reset token
     */
    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid reset token"));

        if (resetToken.isExpired()) {
            throw new RuntimeException("Reset token has expired");
        }

        if (resetToken.getUsed()) {
            throw new RuntimeException("Reset token has already been used");
        }

        User user = resetToken.getUser();
        user.setPassword(encoder.encode(newPassword));
        userRepository.save(user);

        resetToken.setUsed(true);
        tokenRepository.save(resetToken);

        // Send confirmation email
        emailService.sendPasswordChangedEmail(user.getEmail(), user.getFullName());

        System.out.println("✅ Password reset successful for: " + user.getEmail());
    }

    /**
     * Verify if reset token is valid
     */
    public boolean verifyResetToken(String token) {
        Optional<PasswordResetToken> resetToken = tokenRepository.findByToken(token);

        if (resetToken.isEmpty()) {
            return false;
        }

        PasswordResetToken tokenEntity = resetToken.get();
        return !tokenEntity.isExpired() && !tokenEntity.getUsed();
    }
}
