// backend/src/main/java/com/hepsi/demo/dto/SignupRequest.java
package com.hepsi.demo.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class SignupRequest {
    private String username;
    private String password;
    private String role;
}
