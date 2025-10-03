package com.hepsi.demo.security;

import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Filter that executes once per request to check for a JWT token in the Authorization header.
 * If a valid token is found, it extracts the username and role, and sets the user's
 * authentication in the Spring Security Context for request authorization.
 */
@Component
public class JwtRequestFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    public JwtRequestFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        final String authorizationHeader = request.getHeader("Authorization");

        String username = null;
        String jwt = null;
        String role = null;

        // 1. Check if the header exists and starts with "Bearer "
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwt = authorizationHeader.substring(7); // Extract the token (after "Bearer ")
            try {
                username = jwtUtil.extractUsername(jwt);
                role = jwtUtil.extractRole(jwt);

                // ✅ Debug logs
                System.out.println("🔑 Extracted JWT: " + jwt);
                System.out.println("🔑 JWT Username: " + username);
                System.out.println("🔑 JWT Role: " + role);

            } catch (ExpiredJwtException e) {
                // Handle expired token case
                System.out.println("❌ JWT Token has expired: " + e.getMessage());
            } catch (Exception e) {
                System.out.println("❌ Error validating JWT: " + e.getMessage());
            }
        }

        // 2. Validate the token and set up Spring Security Context
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            if (role != null) {
                // Create authority based on the role extracted from the token
                SimpleGrantedAuthority authority = new SimpleGrantedAuthority(role.toUpperCase());
                List<SimpleGrantedAuthority> authorities = List.of(authority);

                // Debug log
                System.out.println("✅ Setting authorities in context: " + authorities);

                // Create a basic UserDetails object for authentication context
                UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                        username,
                        "", // Password is not needed once token is validated
                        authorities
                );

                UsernamePasswordAuthenticationToken authenticationToken =
                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

                // Set details about the request
                authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // Set the authentication object in the Security Context
                SecurityContextHolder.getContext().setAuthentication(authenticationToken);

                // Final debug log
                System.out.println("✅ Authentication set for user: " + username + " with role: " + role);
            }
        }

        // Proceed to the next filter in the chain (or the controller)
        chain.doFilter(request, response);
    }
}
