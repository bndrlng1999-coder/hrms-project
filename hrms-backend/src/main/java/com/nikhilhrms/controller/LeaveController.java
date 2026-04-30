package com.nikhilhrms.controller;

import com.nikhilhrms.dto.ApiResponse;
import com.nikhilhrms.dto.LeaveRequestDTO;
import com.nikhilhrms.service.LeaveService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/leave")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class LeaveController {

    @Autowired
    private LeaveService leaveService;

    @PostMapping("/apply")
    public ResponseEntity<ApiResponse<LeaveRequestDTO>> applyLeave(@RequestBody LeaveRequestDTO dto) {
        LeaveRequestDTO created = leaveService.applyLeave(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Leave applied", created));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<ApiResponse<List<LeaveRequestDTO>>> getEmployeeLeaves(@PathVariable Long employeeId) {
        List<LeaveRequestDTO> leaves = leaveService.getEmployeeLeaves(employeeId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Leaves retrieved", leaves));
    }

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<LeaveRequestDTO>>> getPendingLeaves() {
        List<LeaveRequestDTO> leaves = leaveService.getPendingLeaves();
        return ResponseEntity.ok(new ApiResponse<>(true, "Pending leaves retrieved", leaves));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<LeaveRequestDTO>> approveLeave(@PathVariable Long id, @RequestParam Long approvedBy) {
        LeaveRequestDTO approved = leaveService.approveLeave(id, approvedBy);
        return ResponseEntity.ok(new ApiResponse<>(true, "Leave approved", approved));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<LeaveRequestDTO>> rejectLeave(@PathVariable Long id) {
        LeaveRequestDTO rejected = leaveService.rejectLeave(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Leave rejected", rejected));
    }
}
