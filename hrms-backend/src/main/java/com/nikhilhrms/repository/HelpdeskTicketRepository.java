package com.nikhilhrms.repository;

import com.nikhilhrms.entity.HelpdeskTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HelpdeskTicketRepository extends JpaRepository<HelpdeskTicket, Long> {
    List<HelpdeskTicket> findByEmployeeId(Long employeeId);
    List<HelpdeskTicket> findByStatus(HelpdeskTicket.Status status);
    Optional<HelpdeskTicket> findByTicketNumber(String ticketNumber);
}
