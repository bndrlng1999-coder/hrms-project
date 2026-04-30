package com.nikhilhrms.controller;

import com.nikhilhrms.dto.ApiResponse;
import com.nikhilhrms.dto.EmployeeDTO;
import com.nikhilhrms.dto.RegisterEmployeeRequest;
import com.nikhilhrms.service.AppAuditService;
import com.nikhilhrms.service.AuthService;
import com.nikhilhrms.service.EmployeeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/employees")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class EmployeeController {

    @Autowired
    private EmployeeService employeeService;

    @Autowired
    private AuthService authService;

    @Autowired
    private AppAuditService auditService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<EmployeeDTO>>> getAllEmployees() {
        try {
            List<EmployeeDTO> employees = employeeService.getAllEmployees();
            return ResponseEntity.ok(new ApiResponse<>(true, "Employees retrieved successfully", employees));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EmployeeDTO>> getEmployeeById(@PathVariable Long id) {
        try {
            EmployeeDTO employee = employeeService.getEmployeeById(id);
            return ResponseEntity.ok(new ApiResponse<>(true, "Employee retrieved successfully", employee));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse<>(false, e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<EmployeeDTO>> getEmployeeByUserId(@PathVariable Long userId) {
        try {
            EmployeeDTO employee = employeeService.getEmployeeByUserId(userId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Employee retrieved successfully", employee));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse<>(false, e.getMessage()));
        }
    }

    @GetMapping("/department/{departmentId}")
    public ResponseEntity<ApiResponse<List<EmployeeDTO>>> getEmployeesByDepartment(@PathVariable Long departmentId) {
        try {
            List<EmployeeDTO> employees = employeeService.getEmployeesByDepartment(departmentId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Employees retrieved successfully", employees));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('EMPLOYEE_UPDATE')")
    public ResponseEntity<ApiResponse<EmployeeDTO>> updateEmployee(@PathVariable Long id, @RequestBody EmployeeDTO dto) {
        try {
            EmployeeDTO updated = employeeService.updateEmployee(id, dto);
            return ResponseEntity.ok(new ApiResponse<>(true, "Employee updated successfully", updated));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>(false, e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('EMPLOYEE_DELETE')")
    public ResponseEntity<ApiResponse<String>> deleteEmployee(@PathVariable Long id, Authentication authentication) {
        try {
            employeeService.deleteEmployee(id);
            auditService.record(authentication.getName(), "EMPLOYEE", "EMPLOYEE_DELETE", "Employee", id, "Employee deactivated/removed");
            return ResponseEntity.ok(new ApiResponse<>(true, "Employee deleted successfully", ""));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>(false, e.getMessage()));
        }
    }

    @PostMapping
    @PreAuthorize("hasAuthority('EMPLOYEE_CREATE')")
    public ResponseEntity<ApiResponse<String>> createEmployee(@RequestBody RegisterEmployeeRequest request, Authentication authentication) {
        return ResponseEntity.status(HttpStatus.GONE)
                .body(new ApiResponse<>(false, "Employee login creation is disabled here. Use SUPER_ADMIN Admin Users panel.", ""));
    }

    @PostMapping("/interns")
    @PreAuthorize("hasAuthority('INTERN_CREATE')")
    public ResponseEntity<ApiResponse<String>> createIntern(@RequestBody RegisterEmployeeRequest request, Authentication authentication) {
        return ResponseEntity.status(HttpStatus.GONE)
                .body(new ApiResponse<>(false, "Intern login creation is disabled here. Use SUPER_ADMIN Admin Users panel.", ""));
    }
}
