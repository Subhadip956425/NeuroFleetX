package com.infosys.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String fullName;
    private String email;
    private String password;
    private String role; // ADMIN, MANAGER, DRIVER, CUSTOMER
}
