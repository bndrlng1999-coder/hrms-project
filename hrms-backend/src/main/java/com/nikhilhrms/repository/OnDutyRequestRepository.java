package com.nikhilhrms.repository;

import com.nikhilhrms.entity.OnDutyRequest;
import com.nikhilhrms.entity.WorkFromHomeRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface OnDutyRequestRepository extends JpaRepository<OnDutyRequest, Long> {
    List<OnDutyRequest> findByStatus(WorkFromHomeRequest.RequestStatus status);
    Optional<OnDutyRequest> findByEmployeeIdAndRequestDateAndStatus(Long employeeId, LocalDate requestDate, WorkFromHomeRequest.RequestStatus status);
}
