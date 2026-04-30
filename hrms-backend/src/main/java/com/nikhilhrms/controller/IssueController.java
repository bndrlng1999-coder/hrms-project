package com.nikhilhrms.controller;

import com.nikhilhrms.dto.ApiResponse;
import com.nikhilhrms.service.ProjectTrackerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/issues")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class IssueController {

    @Autowired
    private ProjectTrackerService projectTrackerService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getIssues(@RequestParam Map<String, String> filters) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Issues retrieved", projectTrackerService.getIssues(filters)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> createIssue(@RequestBody Map<String, Object> request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ApiResponse<>(true, "Issue created", projectTrackerService.createIssue(request)));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse<>(false, e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getIssue(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Issue retrieved", projectTrackerService.getIssue(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateIssue(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            return ResponseEntity.ok(new ApiResponse<>(true, "Issue updated", projectTrackerService.updateIssue(id, request)));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse<>(false, e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateIssueStatus(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            return ResponseEntity.ok(new ApiResponse<>(true, "Issue status updated", projectTrackerService.updateIssueStatus(id, request)));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse<>(false, e.getMessage()));
        }
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getComments(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Comments retrieved", projectTrackerService.getComments(id)));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<Map<String, Object>>> addComment(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Comment added", projectTrackerService.addComment(id, request)));
    }

    @GetMapping("/{id}/activity")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getActivity(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Activity retrieved", projectTrackerService.getActivity(id)));
    }
}
