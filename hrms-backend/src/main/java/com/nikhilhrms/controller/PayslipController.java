package com.nikhilhrms.controller;

import com.nikhilhrms.dto.ApiResponse;
import com.nikhilhrms.dto.PayslipDTO;
import com.nikhilhrms.service.AppAuditService;
import com.nikhilhrms.service.PayslipService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/payslips")
public class PayslipController {

    @Autowired
    private PayslipService payslipService;

    @Autowired
    private AppAuditService auditService;

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<ApiResponse<List<PayslipDTO>>> getEmployeePayslips(@PathVariable Long employeeId) {
        List<PayslipDTO> payslips = payslipService.getEmployeePayslips(employeeId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Payslips retrieved", payslips));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PayslipDTO>>> getAllPayslips() {
        List<PayslipDTO> payslips = payslipService.getAllPayslips();
        return ResponseEntity.ok(new ApiResponse<>(true, "All payslips retrieved", payslips));
    }

    @PostMapping("/generate")
    @PreAuthorize("hasAuthority('PAYSLIP_GENERATE')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generatePayslips(@RequestBody(required = false) Map<String, Object> request, Authentication authentication) {
        Map<String, Object> body = request == null ? Map.of() : request;
        auditService.record(authentication.getName(), "PAYROLL", "PAYSLIP_GENERATE", "Payslip", null, body.toString());
        Map<String, Object> response = new HashMap<>();
        response.put("status", "RECORDED");
        response.put("month", body.get("month"));
        response.put("year", body.get("year"));
        return ResponseEntity.ok(new ApiResponse<>(true, "Payslip generation request recorded", response));
    }
}
