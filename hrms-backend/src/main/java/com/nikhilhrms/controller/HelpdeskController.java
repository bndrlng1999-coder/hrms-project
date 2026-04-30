package com.nikhilhrms.controller;

import com.nikhilhrms.dto.ApiResponse;
import com.nikhilhrms.service.AppAuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/helpdesk")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class HelpdeskController {

    @Autowired
    private AppAuditService auditService;

    @PostMapping("/tickets")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createTicket(@RequestBody Map<String, Object> request) {
        Map<String, Object> ticket = new HashMap<>();
        ticket.put("id", 1);
        ticket.put("ticketNumber", "TKT-" + System.currentTimeMillis());
        ticket.put("title", request.get("title"));
        ticket.put("status", "OPEN");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Ticket created", ticket));
    }

    @GetMapping("/tickets")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTickets() {
        Map<String, Object> response = new HashMap<>();
        response.put("tickets", new java.util.ArrayList<>());
        return ResponseEntity.ok(new ApiResponse<>(true, "Tickets retrieved", response));
    }

    @PostMapping("/tickets/{id}/reply")
    @PreAuthorize("hasAnyAuthority('HELPDESK_REPLY','HELPDESK_MANAGE')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> replyToTicket(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request,
            Authentication authentication
    ) {
        Map<String, Object> reply = new HashMap<>();
        reply.put("ticketId", id);
        reply.put("reply", request.get("reply"));
        reply.put("status", request.getOrDefault("status", "REPLIED"));
        auditService.record(authentication.getName(), "HELPDESK", "HELPDESK_REPLY", "HelpdeskTicket", id, String.valueOf(request.get("reply")));
        return ResponseEntity.ok(new ApiResponse<>(true, "Reply added", reply));
    }
}
