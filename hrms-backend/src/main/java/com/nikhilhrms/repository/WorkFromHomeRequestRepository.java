package com.nikhilhrms.repository;

import com.nikhilhrms.entity.WorkFromHomeRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface WorkFromHomeRequestRepository extends JpaRepository<WorkFromHomeRequest, Long> {
    List<WorkFromHomeRequest> findByStatus(WorkFromHomeRequest.RequestStatus status);
    Optional<WorkFromHomeRequest> findByEmployeeIdAndRequestDateAndStatus(Long employeeId, LocalDate requestDate, WorkFromHomeRequest.RequestStatus status);
}
