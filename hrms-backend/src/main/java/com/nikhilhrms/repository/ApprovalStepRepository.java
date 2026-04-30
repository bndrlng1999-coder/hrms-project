package com.nikhilhrms.repository;

import com.nikhilhrms.entity.ApprovalStatus;
import com.nikhilhrms.entity.ApprovalStep;
import com.nikhilhrms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ApprovalStepRepository extends JpaRepository<ApprovalStep, Long> {
    Optional<ApprovalStep> findByWorkflowIdAndLevel(Long workflowId, Integer level);
    List<ApprovalStep> findByApproverRoleAndStatus(User.Role role, ApprovalStatus status);
}
