package com.nikhilhrms.service;

import com.nikhilhrms.dto.DashboardStatsDTO;
import com.nikhilhrms.entity.Attendance;
import com.nikhilhrms.entity.LeaveRequest;
import com.nikhilhrms.repository.AttendanceRepository;
import com.nikhilhrms.repository.EmployeeRepository;
import com.nikhilhrms.repository.LeaveRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

@Service
public class DashboardService {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private LeaveRequestRepository leaveRequestRepository;

    public DashboardStatsDTO getDashboardStats() {
        DashboardStatsDTO stats = new DashboardStatsDTO();
        
        stats.setTotalEmployees(employeeRepository.count());
        
        LocalDate today = LocalDate.now();
        long presentCount = attendanceRepository.countByAttendanceDateAndStatusIn(
            today, Arrays.asList(Attendance.Status.APPROVED, Attendance.Status.PRESENT)
        );
        stats.setPresentToday(presentCount);
        
        long absentCount = attendanceRepository.countByAttendanceDateAndStatusIn(
            today, Arrays.asList(Attendance.Status.ABSENT)
        );
        stats.setAbsentToday(absentCount);
        
        long pendingLeaves = leaveRequestRepository.findByStatus(LeaveRequest.Status.PENDING).size();
        stats.setPendingLeaveRequests(pendingLeaves);
        
        stats.setTotalPayroll(0.0);
        
        return stats;
    }
}
