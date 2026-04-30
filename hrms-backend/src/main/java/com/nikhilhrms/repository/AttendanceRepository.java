package com.nikhilhrms.repository;

import com.nikhilhrms.entity.Attendance;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByEmployeeId(Long employeeId);
    List<Attendance> findByEmployeeIdOrderByAttendanceDateDesc(Long employeeId);
    List<Attendance> findByEmployeeIdAndAttendanceDateBetween(Long employeeId, LocalDate fromDate, LocalDate toDate);
    List<Attendance> findByAttendanceDateBetween(LocalDate fromDate, LocalDate toDate);
    Optional<Attendance> findByEmployeeIdAndAttendanceDate(Long employeeId, LocalDate attendanceDate);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Attendance> findWithLockByEmployeeIdAndAttendanceDate(Long employeeId, LocalDate attendanceDate);

    List<Attendance> findByStatusOrderByAttendanceDateDesc(Attendance.Status status);
    long countByAttendanceDateAndStatusIn(LocalDate date, List<Attendance.Status> statuses);
}
