package com.nikhilhrms.controller;

import com.nikhilhrms.dto.ApiResponse;
import com.nikhilhrms.entity.Department;
import com.nikhilhrms.entity.Employee;
import com.nikhilhrms.entity.Shift;
import com.nikhilhrms.entity.ShiftAssignment;
import com.nikhilhrms.repository.DepartmentRepository;
import com.nikhilhrms.repository.EmployeeRepository;
import com.nikhilhrms.repository.ShiftAssignmentRepository;
import com.nikhilhrms.repository.ShiftRepository;
import com.nikhilhrms.service.AppAuditService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/shifts")
public class ShiftController {

    private final ShiftRepository shiftRepository;
    private final ShiftAssignmentRepository shiftAssignmentRepository;
    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final AppAuditService auditService;

    public ShiftController(
            ShiftRepository shiftRepository,
            ShiftAssignmentRepository shiftAssignmentRepository,
            EmployeeRepository employeeRepository,
            DepartmentRepository departmentRepository,
            AppAuditService auditService
    ) {
        this.shiftRepository = shiftRepository;
        this.shiftAssignmentRepository = shiftAssignmentRepository;
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.auditService = auditService;
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('SHIFT_CREATE','SHIFT_ASSIGN','ATTENDANCE_APPROVE','ATTENDANCE_MANAGE')")
    public ResponseEntity<ApiResponse<List<Shift>>> getShifts() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Shifts retrieved", shiftRepository.findByActiveTrue()));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('SHIFT_CREATE')")
    public ResponseEntity<ApiResponse<Shift>> createShift(@RequestBody Map<String, String> body, Authentication authentication) {
        Shift shift = new Shift();
        applyShiftBody(shift, body);
        Shift created = shiftRepository.save(shift);
        auditService.record(authentication.getName(), "SHIFT", "SHIFT_CREATE", "Shift", created.getId(), created.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>(true, "Shift created", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('SHIFT_CREATE')")
    public ResponseEntity<ApiResponse<Shift>> updateShift(@PathVariable Long id, @RequestBody Map<String, String> body, Authentication authentication) {
        Shift shift = shiftRepository.findById(id).orElseThrow(() -> new RuntimeException("Shift not found"));
        applyShiftBody(shift, body);
        shift.setUpdatedAt(java.time.LocalDateTime.now());
        Shift updated = shiftRepository.save(shift);
        auditService.record(authentication.getName(), "SHIFT", "SHIFT_UPDATE", "Shift", updated.getId(), updated.getName());
        return ResponseEntity.ok(new ApiResponse<>(true, "Shift updated", updated));
    }

    @PostMapping("/assign")
    @PreAuthorize("hasAuthority('SHIFT_ASSIGN')")
    public ResponseEntity<ApiResponse<ShiftAssignment>> assignShift(@RequestBody Map<String, String> body, Authentication authentication) {
        Shift shift = shiftRepository.findById(Long.valueOf(body.get("shiftId")))
                .orElseThrow(() -> new RuntimeException("Shift not found"));
        ShiftAssignment assignment = new ShiftAssignment();
        assignment.setShift(shift);
        if (body.get("employeeId") != null && !body.get("employeeId").isBlank()) {
            Employee employee = employeeRepository.findById(Long.valueOf(body.get("employeeId")))
                    .orElseThrow(() -> new RuntimeException("Employee not found"));
            assignment.setEmployee(employee);
            assignment.setAssignmentType(ShiftAssignment.AssignmentType.EMPLOYEE);
        }
        if (body.get("departmentId") != null && !body.get("departmentId").isBlank()) {
            Department department = departmentRepository.findById(Long.valueOf(body.get("departmentId")))
                    .orElseThrow(() -> new RuntimeException("Department not found"));
            assignment.setDepartment(department);
            assignment.setAssignmentType(ShiftAssignment.AssignmentType.DEPARTMENT);
        }
        assignment.setEffectiveFrom(parseDate(body.get("effectiveFrom"), LocalDate.now()));
        assignment.setEffectiveTo(body.get("effectiveTo") == null || body.get("effectiveTo").isBlank() ? null : LocalDate.parse(body.get("effectiveTo")));
        ShiftAssignment created = shiftAssignmentRepository.save(assignment);
        auditService.record(authentication.getName(), "SHIFT", "SHIFT_ASSIGN", "ShiftAssignment", created.getId(), shift.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>(true, "Shift assigned", created));
    }

    private void applyShiftBody(Shift shift, Map<String, String> body) {
        if (body.get("name") != null) shift.setName(body.get("name"));
        if (body.get("startTime") != null) shift.setStartTime(LocalTime.parse(body.get("startTime")));
        if (body.get("endTime") != null) shift.setEndTime(LocalTime.parse(body.get("endTime")));
        if (body.get("gracePeriodMinutes") != null) shift.setGracePeriodMinutes(Integer.valueOf(body.get("gracePeriodMinutes")));
        if (body.get("halfDayThresholdMinutes") != null) shift.setHalfDayThresholdMinutes(Integer.valueOf(body.get("halfDayThresholdMinutes")));
        if (body.get("fullDayMinimumMinutes") != null) shift.setFullDayMinimumMinutes(Integer.valueOf(body.get("fullDayMinimumMinutes")));
        if (body.get("overtimeThresholdMinutes") != null) shift.setOvertimeThresholdMinutes(Integer.valueOf(body.get("overtimeThresholdMinutes")));
        if (body.get("weekendRule") != null) shift.setWeekendRule(body.get("weekendRule"));
    }

    private LocalDate parseDate(String value, LocalDate fallback) {
        return value == null || value.isBlank() ? fallback : LocalDate.parse(value);
    }
}
