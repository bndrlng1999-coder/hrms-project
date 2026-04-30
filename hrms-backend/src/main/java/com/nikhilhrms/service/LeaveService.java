package com.nikhilhrms.service;

import com.nikhilhrms.dto.LeaveRequestDTO;
import com.nikhilhrms.entity.Employee;
import com.nikhilhrms.entity.LeaveRequest;
import com.nikhilhrms.repository.EmployeeRepository;
import com.nikhilhrms.repository.LeaveRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LeaveService {

    @Autowired
    private LeaveRequestRepository leaveRequestRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    public LeaveRequestDTO applyLeave(LeaveRequestDTO dto) {
        Employee employee = employeeRepository.findById(dto.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        LeaveRequest leaveRequest = new LeaveRequest();
        leaveRequest.setEmployee(employee);
        leaveRequest.setLeaveType(LeaveRequest.LeaveType.valueOf(dto.getLeaveType()));
        leaveRequest.setFromDate(dto.getFromDate());
        leaveRequest.setToDate(dto.getToDate());
        leaveRequest.setNumberOfDays(dto.getNumberOfDays());
        leaveRequest.setReason(dto.getReason());
        leaveRequest.setStatus(LeaveRequest.Status.PENDING);

        leaveRequest = leaveRequestRepository.save(leaveRequest);
        return mapToDTO(leaveRequest);
    }

    public List<LeaveRequestDTO> getEmployeeLeaves(Long employeeId) {
        return leaveRequestRepository.findByEmployeeId(employeeId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<LeaveRequestDTO> getPendingLeaves() {
        return leaveRequestRepository.findByStatus(LeaveRequest.Status.PENDING).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public LeaveRequestDTO approveLeave(Long id, Long approvedBy) {
        LeaveRequest leaveRequest = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Leave request not found"));
        leaveRequest.setStatus(LeaveRequest.Status.APPROVED);
        leaveRequest.setApprovedBy(approvedBy);
        leaveRequest.setApprovalDate(LocalDate.now());
        leaveRequest = leaveRequestRepository.save(leaveRequest);
        return mapToDTO(leaveRequest);
    }

    public LeaveRequestDTO rejectLeave(Long id) {
        LeaveRequest leaveRequest = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Leave request not found"));
        leaveRequest.setStatus(LeaveRequest.Status.REJECTED);
        leaveRequest = leaveRequestRepository.save(leaveRequest);
        return mapToDTO(leaveRequest);
    }

    private LeaveRequestDTO mapToDTO(LeaveRequest leaveRequest) {
        LeaveRequestDTO dto = new LeaveRequestDTO();
        dto.setId(leaveRequest.getId());
        dto.setEmployeeId(leaveRequest.getEmployee().getId());
        dto.setEmployeeName(leaveRequest.getEmployee().getFirstName() + " " + leaveRequest.getEmployee().getLastName());
        dto.setLeaveType(leaveRequest.getLeaveType().toString());
        dto.setFromDate(leaveRequest.getFromDate());
        dto.setToDate(leaveRequest.getToDate());
        dto.setNumberOfDays(leaveRequest.getNumberOfDays());
        dto.setReason(leaveRequest.getReason());
        dto.setStatus(leaveRequest.getStatus().toString());
        dto.setApprovedBy(leaveRequest.getApprovedBy());
        return dto;
    }
}
