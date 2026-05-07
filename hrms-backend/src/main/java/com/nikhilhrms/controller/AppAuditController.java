package com.nikhilhrms.controller;

import com.nikhilhrms.dto.ApiResponse;
import com.nikhilhrms.entity.AppAuditLog;
import com.nikhilhrms.repository.AppAuditLogRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/admin/audit-logs")
public class AppAuditController {

    private final AppAuditLogRepository repository;

    public AppAuditController(AppAuditLogRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('AUDIT_VIEW')")
    public ResponseEntity<ApiResponse<List<AppAuditLog>>> getAuditLogs() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Audit logs retrieved", repository.findAllByOrderByCreatedAtDesc()));
    }
}
