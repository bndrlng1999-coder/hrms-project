package com.nikhilhrms.repository;

import com.nikhilhrms.entity.InternalMailbox;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InternalMailboxRepository extends JpaRepository<InternalMailbox, Long> {
    Optional<InternalMailbox> findByEmployeeId(Long employeeId);
    Optional<InternalMailbox> findByEmailAddressIgnoreCase(String emailAddress);
    List<InternalMailbox> findByActiveTrueOrderByDisplayNameAsc();
    boolean existsByEmployeeId(Long employeeId);
}
