package com.hepsi.demo.services;

import com.hepsi.demo.dto.LoginRequest;
import com.hepsi.demo.dto.AuthResponse;
import com.hepsi.demo.model.User;

public interface AuthService {
    /**
     * Authenticates a user based on their username, password, and requested role.
     * @param loginRequest Contains username, password, and role.
     * @return AuthResponse containing the JWT token and the authenticated user's role.
     * @throws RuntimeException if login fails due to invalid credentials or role mismatch.
     */
    AuthResponse login(LoginRequest loginRequest);

    /**
     * Registers a new user in the system.
     * @param user The User object to save.
     * @return The saved User object.
     */
    User signup(User user);
}
