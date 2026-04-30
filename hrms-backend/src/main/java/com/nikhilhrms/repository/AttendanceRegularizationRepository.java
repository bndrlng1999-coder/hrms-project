package com.nikhilhrms.repository;

import com.nikhilhrms.entity.AttendanceRegularization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttendanceRegularizationRepository extends JpaRepository<AttendanceRegularization, Long> {
    List<AttendanceRegularization> findByStatus(AttendanceRegularization.Status status);
    List<AttendanceRegularization> findByRequestedById(Long employeeId);
}
