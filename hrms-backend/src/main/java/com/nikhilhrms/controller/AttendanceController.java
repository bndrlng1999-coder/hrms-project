package com.nikhilhrms.controller;

import com.nikhilhrms.dto.ApiResponse;
import com.nikhilhrms.dto.AttendanceDTO;
import com.nikhilhrms.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/attendance")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class AttendanceController {

    @Autowired
    private AttendanceService attendanceService;

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<ApiResponse<List<AttendanceDTO>>> getEmployeeAttendance(@PathVariable Long employeeId) {
        List<AttendanceDTO> attendance = attendanceService.getEmployeeAttendance(employeeId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Attendance retrieved", attendance));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AttendanceDTO>> markAttendance(@RequestBody AttendanceDTO dto, Authentication authentication) {
        boolean canManage = authentication.getAuthorities().stream()
                .anyMatch(authority -> "ATTENDANCE_MANAGE".equals(authority.getAuthority()));
        AttendanceDTO created = attendanceService.markAttendance(dto, authentication.getName(), canManage);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Attendance marked", created));
    }

    @PostMapping("/check-in")
    public ResponseEntity<ApiResponse<AttendanceDTO>> checkIn(Authentication authentication) {
        AttendanceDTO attendance = attendanceService.checkIn(authentication.getName());
        return ResponseEntity.ok(new ApiResponse<>(true, "Check-in submitted", attendance));
    }

    @PostMapping("/check-out")
    public ResponseEntity<ApiResponse<AttendanceDTO>> checkOut(Authentication authentication) {
        AttendanceDTO attendance = attendanceService.checkOut(authentication.getName());
        return ResponseEntity.ok(new ApiResponse<>(true, "Check-out submitted", attendance));
    }

    @GetMapping("/today")
    public ResponseEntity<ApiResponse<AttendanceDTO>> today(Authentication authentication) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Today attendance retrieved", attendanceService.getToday(authentication.getName())));
    }

    @GetMapping("/my-calendar")
    public ResponseEntity<ApiResponse<List<AttendanceDTO>>> myCalendar(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            Authentication authentication
    ) {
        java.time.LocalDate today = java.time.LocalDate.now();
        return ResponseEntity.ok(new ApiResponse<>(true, "Attendance calendar retrieved",
                attendanceService.getMyCalendar(authentication.getName(), year == null ? today.getYear() : year, month == null ? today.getMonthValue() : month)));
    }

    @GetMapping("/my-history")
    public ResponseEntity<ApiResponse<List<AttendanceDTO>>> myHistory(Authentication authentication) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Attendance history retrieved", attendanceService.getMyHistory(authentication.getName())));
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ATTENDANCE_APPROVE','ATTENDANCE_MANAGE')")
    public ResponseEntity<ApiResponse<List<AttendanceDTO>>> getAllAttendance() {
        List<AttendanceDTO> attendance = attendanceService.getAllAttendance();
        return ResponseEntity.ok(new ApiResponse<>(true, "All attendance retrieved", attendance));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyAuthority('ATTENDANCE_APPROVE','ATTENDANCE_MANAGE')")
    public ResponseEntity<ApiResponse<List<AttendanceDTO>>> getPendingAttendance() {
        List<AttendanceDTO> attendance = attendanceService.getPendingAttendance();
        return ResponseEntity.ok(new ApiResponse<>(true, "Pending attendance retrieved", attendance));
    }

    @GetMapping("/pending-approvals")
    @PreAuthorize("hasAnyAuthority('ATTENDANCE_APPROVE','ATTENDANCE_MANAGE')")
    public ResponseEntity<ApiResponse<List<AttendanceDTO>>> getPendingApprovals() {
        return getPendingAttendance();
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyAuthority('ATTENDANCE_APPROVE','ATTENDANCE_MANAGE')")
    public ResponseEntity<ApiResponse<AttendanceDTO>> approveAttendance(
            @PathVariable Long id,
            Authentication authentication
    ) {
        AttendanceDTO approved = attendanceService.approveAttendance(id, authentication.getName());
        return ResponseEntity.ok(new ApiResponse<>(true, "Attendance approved", approved));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyAuthority('ATTENDANCE_APPROVE','ATTENDANCE_MANAGE')")
    public ResponseEntity<ApiResponse<AttendanceDTO>> rejectAttendance(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication
    ) {
        String reason = body == null ? null : body.get("reason");
        AttendanceDTO rejected = attendanceService.rejectAttendance(id, authentication.getName(), reason);
        return ResponseEntity.ok(new ApiResponse<>(true, "Attendance rejected", rejected));
    }

    @PostMapping("/{id}/regularize")
    public ResponseEntity<ApiResponse<Map<String, Object>>> regularize(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Regularization requested", attendanceService.requestRegularization(id, authentication.getName(), body)));
    }

    @GetMapping("/regularization/pending")
    @PreAuthorize("hasAnyAuthority('ATTENDANCE_APPROVE','ATTENDANCE_MANAGE')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> pendingRegularizations() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Pending regularizations retrieved", attendanceService.getPendingRegularizations()));
    }

    @PutMapping("/regularization/{id}/approve")
    @PreAuthorize("hasAnyAuthority('ATTENDANCE_APPROVE','ATTENDANCE_MANAGE')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> approveRegularization(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Regularization approved", attendanceService.decideRegularization(id, authentication.getName(), true, null)));
    }

    @PutMapping("/regularization/{id}/reject")
    @PreAuthorize("hasAnyAuthority('ATTENDANCE_APPROVE','ATTENDANCE_MANAGE')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> rejectRegularization(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication
    ) {
        String reason = body == null ? null : body.get("reason");
        return ResponseEntity.ok(new ApiResponse<>(true, "Regularization rejected", attendanceService.decideRegularization(id, authentication.getName(), false, reason)));
    }
}
