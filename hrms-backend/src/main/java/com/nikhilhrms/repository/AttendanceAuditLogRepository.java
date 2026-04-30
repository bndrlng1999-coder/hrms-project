package com.nikhilhrms.repository;

import com.nikhilhrms.entity.AttendanceAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttendanceAuditLogRepository extends JpaRepository<AttendanceAuditLog, Long> {
    List<AttendanceAuditLog> findByAttendanceIdOrderByCreatedAtDesc(Long attendanceId);
}
