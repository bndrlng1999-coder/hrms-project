package com.nikhilhrms.controller;

import com.nikhilhrms.dto.ApiResponse;
import com.nikhilhrms.dto.UserDTO;
import com.nikhilhrms.dto.CreateUserRequest;
import com.nikhilhrms.entity.User;
import com.nikhilhrms.service.UserManagementService;
import com.nikhilhrms.service.AppAuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * User Management Controller - SUPER_ADMIN Only
 * Handles user creation, role assignment, and verification
 */
@RestController
@RequestMapping("/admin/users")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class UserManagementController {

    @Autowired
    private UserManagementService userManagementService;

    @Autowired
    private AppAuditService auditService;

    /**
     * Get all users (SUPER_ADMIN only)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<UserDTO>>> getAllUsers() {
        try {
            List<UserDTO> users = userManagementService.getAllUsers();
            return ResponseEntity.ok(new ApiResponse<>(true, "Users retrieved successfully", users));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, e.getMessage()));
        }
    }

    /**
     * Get user by ID (SUPER_ADMIN only)
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDTO>> getUserById(@PathVariable Long id) {
        try {
            UserDTO user = userManagementService.getUserById(id);
            return ResponseEntity.ok(new ApiResponse<>(true, "User retrieved successfully", user));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse<>(false, e.getMessage()));
        }
    }

    /**
     * Create new user (SUPER_ADMIN only)
     * - Generates temporary password
     * - Sets account status to PENDING_VERIFICATION
     * - Creates employee record if needed
     */
    @PostMapping
    public ResponseEntity<ApiResponse<UserDTO>> createUser(
            @RequestBody CreateUserRequest request,
            Authentication authentication) {
        try {
            UserDTO newUser = userManagementService.createUser(request);
            auditService.record(authentication.getName(), "USER_MANAGEMENT", "USER_CREATE",
                    "User", newUser.getId(), request.getEmail());
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ApiResponse<>(true, "User created successfully. Temporary password generated.", newUser));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>(false, e.getMessage()));
        }
    }

    /**
     * Assign role to user (SUPER_ADMIN only)
     */
    @PutMapping("/{id}/role")
    public ResponseEntity<ApiResponse<UserDTO>> assignRole(
            @PathVariable Long id,
            @RequestParam User.Role role,
            Authentication authentication) {
        try {
            UserDTO updated = userManagementService.assignRole(id, role);
            auditService.record(authentication.getName(), "USER_MANAGEMENT", "ROLE_ASSIGN",
                    "User", id, "Role assigned: " + role);
            return ResponseEntity.ok(new ApiResponse<>(true, "Role assigned successfully", updated));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>(false, e.getMessage()));
        }
    }

    /**
     * Activate/Deactivate user account
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<UserDTO>> updateUserStatus(
            @PathVariable Long id,
            @RequestParam User.AccountStatus status,
            Authentication authentication) {
        try {
            UserDTO updated = userManagementService.updateAccountStatus(id, status);
            auditService.record(authentication.getName(), "USER_MANAGEMENT", "STATUS_UPDATE",
                    "User", id, "Status: " + status);
            return ResponseEntity.ok(new ApiResponse<>(true, "User status updated", updated));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>(false, e.getMessage()));
        }
    }

    /**
     * Reset user password (SUPER_ADMIN only)
     * Generates new temporary password
     */
    @PostMapping("/{id}/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            String tempPassword = userManagementService.resetPassword(id);
            auditService.record(authentication.getName(), "USER_MANAGEMENT", "PASSWORD_RESET",
                    "User", id, "Password reset requested");
            return ResponseEntity.ok(new ApiResponse<>(true, "Password reset. Temporary password: " + tempPassword, tempPassword));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>(false, e.getMessage()));
        }
    }

    /**
     * Delete/Deactivate user
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteUser(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            userManagementService.deleteUser(id);
            auditService.record(authentication.getName(), "USER_MANAGEMENT", "USER_DELETE",
                    "User", id, "User disabled");
            return ResponseEntity.ok(new ApiResponse<>(true, "User disabled successfully", ""));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>(false, e.getMessage()));
        }
    }

    @PutMapping("/{id}/disable")
    public ResponseEntity<ApiResponse<UserDTO>> disableUser(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            UserDTO updated = userManagementService.disableUser(id);
            auditService.record(authentication.getName(), "USER_MANAGEMENT", "USER_DISABLE",
                    "User", id, "User disabled");
            return ResponseEntity.ok(new ApiResponse<>(true, "User disabled successfully", updated));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>(false, e.getMessage()));
        }
    }

    @PutMapping("/{id}/enable")
    public ResponseEntity<ApiResponse<UserDTO>> enableUser(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            UserDTO updated = userManagementService.enableUser(id);
            auditService.record(authentication.getName(), "USER_MANAGEMENT", "USER_ENABLE",
                    "User", id, "User enabled");
            return ResponseEntity.ok(new ApiResponse<>(true, "User enabled successfully", updated));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>(false, e.getMessage()));
        }
    }
}
