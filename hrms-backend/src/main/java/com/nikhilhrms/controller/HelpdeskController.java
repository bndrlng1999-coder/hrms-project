package com.nikhilhrms.controller;

import com.nikhilhrms.dto.ApiResponse;
import com.nikhilhrms.entity.Employee;
import com.nikhilhrms.entity.HelpdeskTicket;
import com.nikhilhrms.repository.EmployeeRepository;
import com.nikhilhrms.repository.HelpdeskTicketRepository;
import com.nikhilhrms.service.AppAuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/helpdesk")
public class HelpdeskController {

    @Autowired
    private AppAuditService auditService;

    @Autowired
    private HelpdeskTicketRepository ticketRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @PostMapping("/tickets")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createTicket(@RequestBody Map<String, Object> request, Authentication authentication) {
        Employee employee = currentEmployee(authentication);
        HelpdeskTicket ticket = new HelpdeskTicket();
        ticket.setEmployee(employee);
        ticket.setTicketNumber("TKT-" + System.currentTimeMillis());
        ticket.setTitle(String.valueOf(request.getOrDefault("title", "Support request")));
        ticket.setDescription(String.valueOf(request.getOrDefault("description", "")));
        ticket.setCategory(parseCategory(request.get("category")));
        ticket.setStatus(HelpdeskTicket.Status.OPEN);
        ticket.setPriority(parsePriority(request.get("priority")));
        ticket = ticketRepository.save(ticket);
        auditService.record(authentication.getName(), "HELPDESK", "HELPDESK_CREATE", "HelpdeskTicket", ticket.getId(), ticket.getTitle());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Ticket created", ticketDto(ticket)));
    }

    @GetMapping("/tickets")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTickets(Authentication authentication) {
        boolean canManage = authentication.getAuthorities().stream()
                .anyMatch(authority -> "HELPDESK_MANAGE".equals(authority.getAuthority()) || "HELPDESK_REPLY".equals(authority.getAuthority()));
        List<HelpdeskTicket> tickets = canManage
                ? ticketRepository.findAll()
                : ticketRepository.findByEmployeeId(currentEmployee(authentication).getId());
        Map<String, Object> response = new HashMap<>();
        response.put("tickets", tickets.stream()
                .sorted((left, right) -> right.getCreatedAt().compareTo(left.getCreatedAt()))
                .map(this::ticketDto)
                .collect(Collectors.toList()));
        return ResponseEntity.ok(new ApiResponse<>(true, "Tickets retrieved", response));
    }

    @PostMapping("/tickets/{id}/reply")
    @PreAuthorize("hasAnyAuthority('HELPDESK_REPLY','HELPDESK_MANAGE')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> replyToTicket(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request,
            Authentication authentication
    ) {
        HelpdeskTicket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        String reply = String.valueOf(request.getOrDefault("reply", ""));
        ticket.setResolutionNotes(reply);
        ticket.setStatus(parseStatus(request.get("status")));
        ticket.setUpdatedAt(LocalDateTime.now());
        if (ticket.getStatus() == HelpdeskTicket.Status.RESOLVED) {
            ticket.setResolvedAt(LocalDateTime.now());
        }
        ticket = ticketRepository.save(ticket);
        auditService.record(authentication.getName(), "HELPDESK", "HELPDESK_REPLY", "HelpdeskTicket", id, String.valueOf(request.get("reply")));
        return ResponseEntity.ok(new ApiResponse<>(true, "Reply added", ticketDto(ticket)));
    }

    private Employee currentEmployee(Authentication authentication) {
        return employeeRepository.findByUserEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Employee profile not found"));
    }

    private HelpdeskTicket.Category parseCategory(Object value) {
        try {
            return HelpdeskTicket.Category.valueOf(String.valueOf(value == null ? "GENERAL" : value));
        } catch (Exception ignored) {
            return HelpdeskTicket.Category.GENERAL;
        }
    }

    private HelpdeskTicket.Status parseStatus(Object value) {
        try {
            String raw = String.valueOf(value == null ? "IN_PROGRESS" : value);
            if ("REPLIED".equals(raw)) return HelpdeskTicket.Status.IN_PROGRESS;
            return HelpdeskTicket.Status.valueOf(raw);
        } catch (Exception ignored) {
            return HelpdeskTicket.Status.IN_PROGRESS;
        }
    }

    private Integer parsePriority(Object value) {
        if (value == null || String.valueOf(value).isBlank()) return 2;
        try {
            return Integer.valueOf(String.valueOf(value));
        } catch (Exception ignored) {
            return 2;
        }
    }

    private Map<String, Object> ticketDto(HelpdeskTicket ticket) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", ticket.getId());
        dto.put("ticketNumber", ticket.getTicketNumber());
        dto.put("title", ticket.getTitle());
        dto.put("description", ticket.getDescription());
        dto.put("category", ticket.getCategory());
        dto.put("status", ticket.getStatus());
        dto.put("priority", ticket.getPriority());
        dto.put("employeeName", ticket.getEmployee().getFirstName() + " " + ticket.getEmployee().getLastName());
        dto.put("resolutionNotes", ticket.getResolutionNotes());
        dto.put("createdAt", ticket.getCreatedAt());
        dto.put("updatedAt", ticket.getUpdatedAt());
        dto.put("resolvedAt", ticket.getResolvedAt());
        return dto;
    }
}
