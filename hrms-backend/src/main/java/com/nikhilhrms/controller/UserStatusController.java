package com.nikhilhrms.controller;

import com.nikhilhrms.dto.ApiResponse;
import com.nikhilhrms.dto.UserDTO;
import com.nikhilhrms.service.AppAuditService;
import com.nikhilhrms.service.UserManagementService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class UserStatusController {

    private final UserManagementService userManagementService;
    private final AppAuditService auditService;

    public UserStatusController(UserManagementService userManagementService, AppAuditService auditService) {
        this.userManagementService = userManagementService;
        this.auditService = auditService;
    }

    @PutMapping("/{id}/disable")
    public ResponseEntity<ApiResponse<UserDTO>> disableUser(@PathVariable Long id, Authentication authentication) {
        try {
            UserDTO updated = userManagementService.disableUser(id);
            auditService.record(authentication.getName(), "USER_MANAGEMENT", "USER_DISABLE", "User", id, "User disabled");
            return ResponseEntity.ok(new ApiResponse<>(true, "User disabled successfully", updated));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse<>(false, e.getMessage()));
        }
    }

    @PutMapping("/{id}/enable")
    public ResponseEntity<ApiResponse<UserDTO>> enableUser(@PathVariable Long id, Authentication authentication) {
        try {
            UserDTO updated = userManagementService.enableUser(id);
            auditService.record(authentication.getName(), "USER_MANAGEMENT", "USER_ENABLE", "User", id, "User enabled");
            return ResponseEntity.ok(new ApiResponse<>(true, "User enabled successfully", updated));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse<>(false, e.getMessage()));
        }
    }
}
