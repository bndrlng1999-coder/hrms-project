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
@RequestMapping("/projects")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class ProjectController {

    @Autowired
    private ProjectTrackerService projectTrackerService;

    @Autowired
    private AppAuditService auditService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getProjects() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Projects retrieved", projectTrackerService.getProjects()));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PROJECT_CREATE')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createProject(@RequestBody Map<String, Object> request, Authentication authentication) {
        try {
            Map<String, Object> created = projectTrackerService.createProject(request);
            auditService.record(authentication.getName(), "PROJECT", "PROJECT_CREATE", "Project", asLong(created.get("id")), String.valueOf(created.get("name")));
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ApiResponse<>(true, "Project created", created));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse<>(false, e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProject(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Project retrieved", projectTrackerService.getProject(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('PROJECT_UPDATE','PROJECT_MANAGE')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateProject(@PathVariable Long id, @RequestBody Map<String, Object> request, Authentication authentication) {
        try {
            Map<String, Object> updated = projectTrackerService.updateProject(id, request);
            auditService.record(authentication.getName(), "PROJECT", "PROJECT_UPDATE", "Project", id, String.valueOf(updated.get("name")));
            return ResponseEntity.ok(new ApiResponse<>(true, "Project updated", updated));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse<>(false, e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteProject(@PathVariable Long id) {
        try {
            projectTrackerService.deleteProject(id);
            return ResponseEntity.ok(new ApiResponse<>(true, "Project deleted", ""));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse<>(false, e.getMessage()));
        }
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMembers(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Project members retrieved", projectTrackerService.getProjectMembers(id)));
    }

    @PutMapping("/{id}/members")
    @PreAuthorize("hasAnyAuthority('PROJECT_UPDATE','PROJECT_MANAGE')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> updateMembers(@PathVariable Long id, @RequestBody Map<String, Object> request, Authentication authentication) {
        try {
            List<Map<String, Object>> members = projectTrackerService.updateProjectMembers(id, request);
            auditService.record(authentication.getName(), "PROJECT", "PROJECT_UPDATE", "Project", id, "Project members updated");
            return ResponseEntity.ok(new ApiResponse<>(true, "Project members updated", members));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse<>(false, e.getMessage()));
        }
    }

    private Long asLong(Object value) {
        if (value instanceof Number number) return number.longValue();
        if (value == null) return null;
        return Long.valueOf(String.valueOf(value));
    }
}
