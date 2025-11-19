package com.infosys.security.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtUtils {

    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expirationMs}")
    private long jwtExpirationMs;

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    /**
     * Generate JWT token with username
     * ✅ ORIGINAL: Works for simple tokens
     */
    public String generateJwtToken(String username) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Generate JWT token with username and roles
     * ✅ NEW: Includes roles WITHOUT ROLE_ prefix
     *
     * Example: roles will be ["CUSTOMER", "USER"] instead of ["ROLE_CUSTOMER", "ROLE_USER"]
     */
    public String generateJwtTokenWithRoles(Authentication authentication) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtExpirationMs);

        // ✅ Clean roles: remove ROLE_ prefix
        List<String> roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .map(role -> role.replace("ROLE_", ""))  // Remove ROLE_ prefix
                .collect(Collectors.toList());

        logger.info("✅ JWT Token generated for user: {} with roles: {}",
                authentication.getName(), roles);

        return Jwts.builder()
                .setSubject(authentication.getName())
                .claim("roles", roles)  // ✅ Store cleaned roles
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Generate JWT token with user details
     * ✅ ENHANCED: Full user info with cleaned roles
     */
    public String generateJwtTokenWithUserDetails(String username, String userEmail,
                                                  String userId, List<String> rawRoles) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtExpirationMs);

        // ✅ Clean roles: remove ROLE_ prefix
        List<String> cleanedRoles = rawRoles.stream()
                .map(role -> role.replace("ROLE_", ""))
                .collect(Collectors.toList());

        logger.info("✅ JWT Token generated for user: {} (ID: {}) with roles: {}",
                username, userId, cleanedRoles);

        return Jwts.builder()
                .setSubject(username)
                .claim("userId", userId)
                .claim("email", userEmail)
                .claim("roles", cleanedRoles)  // ✅ Cleaned roles
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Get username from JWT token
     */
    public String getUserNameFromJwt(String token) {
        return Jwts.parser()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    /**
     * Get user ID from JWT token
     * ✅ NEW: Extract userId claim
     */
    public String getUserIdFromJwt(String token) {
        return Jwts.parser()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .get("userId", String.class);
    }

    /**
     * Get roles from JWT token (already cleaned - without ROLE_ prefix)
     * ✅ NEW: Extract roles claim
     *
     * Returns: ["CUSTOMER", "USER"] (without ROLE_ prefix)
     */
    @SuppressWarnings("unchecked")
    public List<String> getRolesFromJwt(String token) {
        return (List<String>) Jwts.parser()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .get("roles", List.class);
    }

    /**
     * Get email from JWT token
     * ✅ NEW: Extract email claim
     */
    public String getEmailFromJwt(String token) {
        return Jwts.parser()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .get("email", String.class);
    }

    /**
     * Validate JWT token
     */
    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parser().setSigningKey(getSigningKey()).build().parseClaimsJws(authToken);
            logger.info("✅ JWT Token validated successfully");
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            logger.error("❌ JWT validation failed: {}", ex.getMessage());
        }
        return false;
    }

    /**
     * Get all claims from JWT token
     * ✅ NEW: For debugging/logging
     */
    public Object getAllClaimsFromJwt(String token) {
        return Jwts.parser()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
