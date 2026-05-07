package com.nikhilhrms.controller;

import com.nikhilhrms.dto.ApiResponse;
import com.nikhilhrms.service.ApprovalWorkflowService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/approvals")
public class ApprovalWorkflowController {

    private final ApprovalWorkflowService approvalWorkflowService;

    public ApprovalWorkflowController(ApprovalWorkflowService approvalWorkflowService) {
        this.approvalWorkflowService = approvalWorkflowService;
    }

    @GetMapping("/queue")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> queue(Authentication authentication) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Approval queue retrieved",
                approvalWorkflowService.pendingQueue(authentication.getName())));
    }

    @GetMapping("/{workflowId}/timeline")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> timeline(@PathVariable Long workflowId) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Approval timeline retrieved",
                approvalWorkflowService.timeline(workflowId)));
    }

    @PutMapping("/{workflowId}/approve")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> approve(
            @PathVariable Long workflowId,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication) {
        String remarks = body == null ? null : body.get("remarks");
        return ResponseEntity.ok(new ApiResponse<>(true, "Approval step approved",
                approvalWorkflowService.approve(workflowId, authentication.getName(), remarks)));
    }

    @PutMapping("/{workflowId}/reject")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> reject(
            @PathVariable Long workflowId,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication) {
        String remarks = body == null ? null : body.get("remarks");
        return ResponseEntity.ok(new ApiResponse<>(true, "Approval step rejected",
                approvalWorkflowService.reject(workflowId, authentication.getName(), remarks)));
    }
}
