package com.nikhilhrms.controller;

import com.nikhilhrms.dto.ApiResponse;
import com.nikhilhrms.service.AttendanceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
public class AttendanceRequestController {

    private final AttendanceService attendanceService;

    public AttendanceRequestController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @PostMapping("/work-from-home")
    public ResponseEntity<ApiResponse<Map<String, Object>>> requestWorkFromHome(
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Work from home requested", attendanceService.requestWorkFromHome(authentication.getName(), body)));
    }

    @PutMapping("/work-from-home/{id}/approve")
    @PreAuthorize("hasAnyAuthority('ATTENDANCE_APPROVE','ATTENDANCE_MANAGE')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> approveWorkFromHome(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Work from home approved", attendanceService.approveWorkFromHome(id, authentication.getName())));
    }

    @PostMapping("/on-duty")
    public ResponseEntity<ApiResponse<Map<String, Object>>> requestOnDuty(
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "On-duty requested", attendanceService.requestOnDuty(authentication.getName(), body)));
    }

    @PutMapping("/on-duty/{id}/approve")
    @PreAuthorize("hasAnyAuthority('ATTENDANCE_APPROVE','ATTENDANCE_MANAGE')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> approveOnDuty(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(new ApiResponse<>(true, "On-duty approved", attendanceService.approveOnDuty(id, authentication.getName())));
    }
}
