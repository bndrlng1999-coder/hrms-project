package com.nikhilhrms.repository;

import com.nikhilhrms.entity.ApprovalHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApprovalHistoryRepository extends JpaRepository<ApprovalHistory, Long> {
    List<ApprovalHistory> findByWorkflowIdOrderByLevelAscApprovedAtAsc(Long workflowId);
}
