package com.nikhilhrms.repository;

import com.nikhilhrms.entity.CrmLead;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CrmLeadRepository extends JpaRepository<CrmLead, Long> {
    List<CrmLead> findByStatusNotIn(List<CrmLead.LeadStatus> statuses);
}
