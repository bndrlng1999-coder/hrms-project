package com.nikhilhrms.repository;

import com.nikhilhrms.entity.ShiftAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ShiftAssignmentRepository extends JpaRepository<ShiftAssignment, Long> {
    List<ShiftAssignment> findByEmployeeIdAndActiveTrue(Long employeeId);
    List<ShiftAssignment> findByDepartmentIdAndActiveTrue(Long departmentId);
    List<ShiftAssignment> findByEffectiveFromLessThanEqualAndActiveTrue(LocalDate date);
}
