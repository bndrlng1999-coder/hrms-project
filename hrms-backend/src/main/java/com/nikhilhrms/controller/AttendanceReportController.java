package com.nikhilhrms.controller;

import com.nikhilhrms.dto.ApiResponse;
import com.nikhilhrms.service.AttendanceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/reports/attendance")
@PreAuthorize("hasAnyAuthority('REPORT_VIEW','ATTENDANCE_MANAGE','ATTENDANCE_APPROVE')")
public class AttendanceReportController {

    private final AttendanceService attendanceService;

    public AttendanceReportController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @GetMapping("/monthly")
    public ResponseEntity<ApiResponse<Map<String, Object>>> monthly(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Long employeeId
    ) {
        LocalDate today = LocalDate.now();
        return ResponseEntity.ok(new ApiResponse<>(true, "Monthly attendance report retrieved",
                attendanceService.monthlyReport(year == null ? today.getYear() : year, month == null ? today.getMonthValue() : month, employeeId)));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> employeeReport(
            @PathVariable Long employeeId,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month
    ) {
        LocalDate today = LocalDate.now();
        return ResponseEntity.ok(new ApiResponse<>(true, "Employee attendance report retrieved",
                attendanceService.monthlyReport(year == null ? today.getYear() : year, month == null ? today.getMonthValue() : month, employeeId)));
    }
}
