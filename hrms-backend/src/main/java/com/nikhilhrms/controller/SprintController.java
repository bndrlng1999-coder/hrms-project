package com.nikhilhrms.controller;

import com.nikhilhrms.dto.ApiResponse;
import com.nikhilhrms.service.AppAuditService;
import com.nikhilhrms.service.ProjectTrackerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/sprints")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class SprintController {

    @Autowired
    private ProjectTrackerService projectTrackerService;

    @Autowired
    private AppAuditService auditService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getSprints(@RequestParam Map<String, String> filters) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Sprints retrieved", projectTrackerService.getSprints(filters)));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('SPRINT_CREATE')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createSprint(@RequestBody Map<String, Object> request, Authentication authentication) {
        try {
            Map<String, Object> created = projectTrackerService.createSprint(request);
            auditService.record(authentication.getName(), "SPRINT", "SPRINT_CREATE", "Sprint", asLong(created.get("id")), String.valueOf(created.get("name")));
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ApiResponse<>(true, "Sprint created", created));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse<>(false, e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSprint(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Sprint retrieved", projectTrackerService.getSprint(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('SPRINT_UPDATE','PROJECT_MANAGE')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateSprint(@PathVariable Long id, @RequestBody Map<String, Object> request, Authentication authentication) {
        try {
            Map<String, Object> updated = projectTrackerService.updateSprint(id, request);
            auditService.record(authentication.getName(), "SPRINT", "SPRINT_UPDATE", "Sprint", id, String.valueOf(updated.get("name")));
            return ResponseEntity.ok(new ApiResponse<>(true, "Sprint updated", updated));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse<>(false, e.getMessage()));
        }
    }

    @PutMapping("/{id}/start")
    @PreAuthorize("hasAnyAuthority('SPRINT_UPDATE','PROJECT_MANAGE')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> startSprint(@PathVariable Long id, Authentication authentication) {
        Map<String, Object> sprint = projectTrackerService.startSprint(id);
        auditService.record(authentication.getName(), "SPRINT", "SPRINT_UPDATE", "Sprint", id, "Sprint started");
        return ResponseEntity.ok(new ApiResponse<>(true, "Sprint started", sprint));
    }

    @PutMapping("/{id}/complete")
    @PreAuthorize("hasAnyAuthority('SPRINT_UPDATE','PROJECT_MANAGE')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> completeSprint(@PathVariable Long id, Authentication authentication) {
        Map<String, Object> sprint = projectTrackerService.completeSprint(id);
        auditService.record(authentication.getName(), "SPRINT", "SPRINT_UPDATE", "Sprint", id, "Sprint completed");
        return ResponseEntity.ok(new ApiResponse<>(true, "Sprint completed", sprint));
    }

    private Long asLong(Object value) {
        if (value instanceof Number number) return number.longValue();
        if (value == null) return null;
        return Long.valueOf(String.valueOf(value));
    }
}
