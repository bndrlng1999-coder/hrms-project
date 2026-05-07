package com.nikhilhrms.controller;

import com.nikhilhrms.dto.ApiResponse;
import com.nikhilhrms.dto.LoginRequest;
import com.nikhilhrms.dto.LoginResponse;
import com.nikhilhrms.dto.ChangePasswordRequest;
import com.nikhilhrms.service.AuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@RequestBody LoginRequest request) {
        try {
            log.info("Login request started for {}", request.getEmail());
            LoginResponse response = authService.login(request);
            log.info("Login request succeeded for {}", request.getEmail());
            return ResponseEntity.ok(new ApiResponse<>(true, "Login successful", response));
        } catch (Exception e) {
            log.warn("Login request failed for {}: {}", request.getEmail(), e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(false, e.getMessage()));
        }
    }

    @PostMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<String>> changePassword(
            @RequestBody ChangePasswordRequest request,
            Authentication authentication) {
        try {
            authService.changePassword(authentication.getName(), request);
            return ResponseEntity.ok(new ApiResponse<>(true, "Password changed successfully", ""));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>(false, e.getMessage()));
        }
    }

    @GetMapping("/validate")
    public ResponseEntity<ApiResponse<String>> validateToken() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Token is valid", ""));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<com.nikhilhrms.dto.UserDTO>> currentUser(Authentication authentication) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Current user retrieved", authService.currentUser(authentication.getName())));
    }
}

