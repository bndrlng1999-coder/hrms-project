package com.nikhilhrms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceDTO {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private LocalDate attendanceDate;
    private String status;
    private String checkInTime;
    private String checkOutTime;
    private String remarks;
    private Long approvedById;
    private String approvedByName;
    private String approvedAt;
    private String rejectionReason;
    private String departmentName;
    private Integer workMinutes;
    private Integer lateMinutes;
    private Integer earlyLogoutMinutes;
    private Integer overtimeMinutes;
    private Long departmentId;
    private Long managerId;
}
