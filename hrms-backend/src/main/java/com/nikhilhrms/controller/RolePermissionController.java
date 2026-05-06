package com.nikhilhrms.controller;

import com.nikhilhrms.dto.ApiResponse;
import com.nikhilhrms.dto.RolePermissionsDTO;
import com.nikhilhrms.dto.UpdateRolePermissionsRequest;
import com.nikhilhrms.entity.User;
import com.nikhilhrms.service.RolePermissionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Set;

@RestController
@RequestMapping("/admin/roles-permissions")
public class RolePermissionController {
    private final RolePermissionService rolePermissionService;

    public RolePermissionController(RolePermissionService rolePermissionService) {
        this.rolePermissionService = rolePermissionService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<RolePermissionsDTO>> getRolePermissions() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Role permissions retrieved", rolePermissionService.getMatrix()));
    }

    @PutMapping("/{role}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Set<String>>> updateRolePermissions(
            @PathVariable User.Role role,
            @RequestBody UpdateRolePermissionsRequest request
    ) {
        Set<String> updated = rolePermissionService.updatePermissions(role, request.getPermissions());
        return ResponseEntity.ok(new ApiResponse<>(true, "Permissions updated successfully", updated));
    }
}
