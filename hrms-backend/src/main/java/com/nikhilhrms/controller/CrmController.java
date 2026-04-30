package com.nikhilhrms.controller;

import com.nikhilhrms.dto.ApiResponse;
import com.nikhilhrms.service.CrmService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/crm")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
@PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','CEO','CTO')")
public class CrmController {

    private final CrmService crmService;

    public CrmController(CrmService crmService) {
        this.crmService = crmService;
    }

    @GetMapping("/leads")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> leads() {
        return ResponseEntity.ok(new ApiResponse<>(true, "CRM leads retrieved", crmService.getLeads()));
    }

    @PostMapping("/leads")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createLead(@RequestBody Map<String, Object> request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "CRM lead created", crmService.createLead(request)));
    }

    @PutMapping("/leads/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateLead(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(new ApiResponse<>(true, "CRM lead updated", crmService.updateLead(id, request)));
    }

    @GetMapping("/clients")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> clients() {
        return ResponseEntity.ok(new ApiResponse<>(true, "CRM clients retrieved", crmService.getClients()));
    }

    @PostMapping("/clients")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createClient(@RequestBody Map<String, Object> request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "CRM client created", crmService.createClient(request)));
    }

    @GetMapping("/deals")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> deals() {
        return ResponseEntity.ok(new ApiResponse<>(true, "CRM deals retrieved", crmService.getDeals()));
    }

    @PostMapping("/deals")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createDeal(@RequestBody Map<String, Object> request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "CRM deal created", crmService.createDeal(request)));
    }

    @PostMapping("/follow-ups")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createFollowUp(@RequestBody Map<String, Object> request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "CRM follow-up created", crmService.createFollowUp(request)));
    }

    @PostMapping("/proposals")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createProposal(@RequestBody Map<String, Object> request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "CRM proposal created", crmService.createProposal(request)));
    }

    @GetMapping("/reports/sla")
    public ResponseEntity<ApiResponse<Map<String, Object>>> slaReport() {
        return ResponseEntity.ok(new ApiResponse<>(true, "CRM SLA report retrieved", crmService.slaReport()));
    }
}
