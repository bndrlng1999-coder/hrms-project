package com.nikhilhrms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDTO {
    private Long totalEmployees;
    private Long presentToday;
    private Long absentToday;
    private Long pendingLeaveRequests;
    private Double totalPayroll;
}
