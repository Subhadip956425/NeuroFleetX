// package com.hepsi.demo.security;

// import org.springframework.context.annotation.Bean;
// import org.springframework.context.annotation.Configuration;
// import org.springframework.security.config.annotation.web.builders.HttpSecurity;
// import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
// import org.springframework.security.crypto.password.PasswordEncoder;
// import org.springframework.security.web.SecurityFilterChain;

// @Configuration
// public class SecurityConfig {

//     @Bean
//     public PasswordEncoder passwordEncoder() {
//         return new BCryptPasswordEncoder();
//     }

//     @Bean
//     public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
//         http
//             .csrf(csrf -> csrf.disable())
//             .authorizeHttpRequests(auth -> auth
//                 .requestMatchers("/api/auth/**").permitAll()   // allow login/signup
//                 .anyRequest().authenticated()
//             )
//             .formLogin(form -> form.disable())   // disable default login page
//             .httpBasic(basic -> basic.disable()); // disable basic auth

//         return http.build();
//     }
// }



package com.hepsi.demo.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())  // disable CSRF for testing with Postman
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()   // allow login/signup APIs
                .requestMatchers("/vehicles/**").permitAll()   // ✅ allow all vehicle APIs
                .anyRequest().permitAll()                      // ✅ allow everything else (temporary)
            )
            .formLogin(form -> form.disable())   // disable default login page
            .httpBasic(basic -> basic.disable()); // disable basic auth

        return http.build();
    }
}

