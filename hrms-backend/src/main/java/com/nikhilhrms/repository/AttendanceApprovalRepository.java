package com.nikhilhrms.repository;

import com.nikhilhrms.entity.AttendanceApproval;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AttendanceApprovalRepository extends JpaRepository<AttendanceApproval, Long> {
}
