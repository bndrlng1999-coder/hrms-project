package com.nikhilhrms.repository;

import com.nikhilhrms.entity.ApprovalStatus;
import com.nikhilhrms.entity.ApprovalWorkflow;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ApprovalWorkflowRepository extends JpaRepository<ApprovalWorkflow, Long> {
    List<ApprovalWorkflow> findByStatusOrderByCreatedAtDesc(ApprovalStatus status);
    Optional<ApprovalWorkflow> findByModuleAndEntityId(ApprovalWorkflow.Module module, Long entityId);
}
