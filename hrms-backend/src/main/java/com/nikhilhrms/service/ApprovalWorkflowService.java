package com.nikhilhrms.service;

import com.nikhilhrms.entity.*;
import com.nikhilhrms.repository.ApprovalHistoryRepository;
import com.nikhilhrms.repository.ApprovalStepRepository;
import com.nikhilhrms.repository.ApprovalWorkflowRepository;
import com.nikhilhrms.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ApprovalWorkflowService {

    private final ApprovalWorkflowRepository workflowRepository;
    private final ApprovalStepRepository stepRepository;
    private final ApprovalHistoryRepository historyRepository;
    private final UserRepository userRepository;

    public ApprovalWorkflowService(
            ApprovalWorkflowRepository workflowRepository,
            ApprovalStepRepository stepRepository,
            ApprovalHistoryRepository historyRepository,
            UserRepository userRepository
    ) {
        this.workflowRepository = workflowRepository;
        this.stepRepository = stepRepository;
        this.historyRepository = historyRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ApprovalWorkflow createWorkflow(
            ApprovalWorkflow.Module module,
            Long entityId,
            String requestedByEmail,
            String summary,
            List<User.Role> approverRoles
    ) {
        if (approverRoles == null || approverRoles.isEmpty()) {
            throw new RuntimeException("Approval workflow requires at least one approver level");
        }
        ApprovalWorkflow workflow = workflowRepository.findByModuleAndEntityId(module, entityId)
                .filter(existing -> existing.getStatus() == ApprovalStatus.PENDING)
                .orElseGet(ApprovalWorkflow::new);
        workflow.setModule(module);
        workflow.setEntityId(entityId);
        workflow.setSummary(summary);
        workflow.setStatus(ApprovalStatus.PENDING);
        workflow.setCurrentLevel(1);
        workflow.setRequestedBy(userRepository.findByEmail(requestedByEmail).orElse(null));
        workflow.setUpdatedAt(LocalDateTime.now());
        workflow.getSteps().clear();
        for (int i = 0; i < approverRoles.size(); i++) {
            ApprovalStep step = new ApprovalStep();
            step.setWorkflow(workflow);
            step.setLevel(i + 1);
            step.setApproverRole(approverRoles.get(i));
            step.setStatus(ApprovalStatus.PENDING);
            workflow.getSteps().add(step);
        }
        return workflowRepository.save(workflow);
    }

    public List<Map<String, Object>> pendingQueue(String approverEmail) {
        User approver = userRepository.findByEmail(approverEmail)
                .orElseThrow(() -> new RuntimeException("Approver not found"));
        return stepRepository.findByApproverRoleAndStatus(approver.getRole(), ApprovalStatus.PENDING)
                .stream()
                .filter(step -> step.getWorkflow().getStatus() == ApprovalStatus.PENDING)
                .filter(step -> Objects.equals(step.getWorkflow().getCurrentLevel(), step.getLevel()))
                .sorted(Comparator.comparing((ApprovalStep step) -> step.getWorkflow().getCreatedAt()).reversed())
                .map(this::queueDto)
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> timeline(Long workflowId) {
        ApprovalWorkflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new RuntimeException("Approval workflow not found"));
        List<Map<String, Object>> rows = new ArrayList<>();
        workflow.getSteps().stream()
                .sorted(Comparator.comparing(ApprovalStep::getLevel))
                .map(this::stepDto)
                .forEach(rows::add);
        historyRepository.findByWorkflowIdOrderByLevelAscApprovedAtAsc(workflowId).stream()
                .map(this::historyDto)
                .forEach(rows::add);
        return rows;
    }

    @Transactional
    public Map<String, Object> approve(Long workflowId, String approverEmail, String remarks) {
        return decide(workflowId, approverEmail, remarks, ApprovalStatus.APPROVED);
    }

    @Transactional
    public Map<String, Object> reject(Long workflowId, String approverEmail, String remarks) {
        return decide(workflowId, approverEmail, remarks, ApprovalStatus.REJECTED);
    }

    private Map<String, Object> decide(Long workflowId, String approverEmail, String remarks, ApprovalStatus decision) {
        ApprovalWorkflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new RuntimeException("Approval workflow not found"));
        if (workflow.getStatus() != ApprovalStatus.PENDING) {
            throw new RuntimeException("Approval workflow is already " + workflow.getStatus());
        }
        ApprovalStep step = stepRepository.findByWorkflowIdAndLevel(workflowId, workflow.getCurrentLevel())
                .orElseThrow(() -> new RuntimeException("Current approval step not found"));
        User approver = userRepository.findByEmail(approverEmail)
                .orElseThrow(() -> new RuntimeException("Approver not found"));
        if (approver.getRole() != step.getApproverRole()) {
            throw new RuntimeException("Current level requires " + step.getApproverRole() + " approval");
        }
        step.setStatus(decision);
        step.setApprovedBy(approver);
        step.setApprovedAt(LocalDateTime.now());
        step.setRemarks(remarks);
        stepRepository.save(step);
        recordHistory(workflow, step, decision, approver, remarks);

        if (decision == ApprovalStatus.REJECTED) {
            workflow.setStatus(ApprovalStatus.REJECTED);
            workflow.setCompletedAt(LocalDateTime.now());
        } else if (workflow.getCurrentLevel() >= workflow.getSteps().size()) {
            workflow.setStatus(ApprovalStatus.APPROVED);
            workflow.setCompletedAt(LocalDateTime.now());
        } else {
            workflow.setCurrentLevel(workflow.getCurrentLevel() + 1);
        }
        workflow.setUpdatedAt(LocalDateTime.now());
        return workflowDto(workflowRepository.save(workflow));
    }

    private void recordHistory(ApprovalWorkflow workflow, ApprovalStep step, ApprovalStatus status, User approver, String remarks) {
        ApprovalHistory history = new ApprovalHistory();
        history.setWorkflow(workflow);
        history.setLevel(step.getLevel());
        history.setApproverRole(step.getApproverRole());
        history.setStatus(status);
        history.setApprovedBy(approver);
        history.setRemarks(remarks);
        historyRepository.save(history);
    }

    private Map<String, Object> queueDto(ApprovalStep step) {
        Map<String, Object> dto = workflowDto(step.getWorkflow());
        dto.put("stepId", step.getId());
        dto.put("level", step.getLevel());
        dto.put("approverRole", step.getApproverRole());
        return dto;
    }

    private Map<String, Object> workflowDto(ApprovalWorkflow workflow) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", workflow.getId());
        dto.put("module", workflow.getModule());
        dto.put("entityId", workflow.getEntityId());
        dto.put("summary", workflow.getSummary());
        dto.put("status", workflow.getStatus());
        dto.put("currentLevel", workflow.getCurrentLevel());
        dto.put("requestedBy", workflow.getRequestedBy() == null ? null : workflow.getRequestedBy().getEmail());
        dto.put("createdAt", workflow.getCreatedAt());
        dto.put("completedAt", workflow.getCompletedAt());
        return dto;
    }

    private Map<String, Object> stepDto(ApprovalStep step) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("type", "STEP");
        dto.put("level", step.getLevel());
        dto.put("approverRole", step.getApproverRole());
        dto.put("status", step.getStatus());
        dto.put("approvedBy", step.getApprovedBy() == null ? null : step.getApprovedBy().getEmail());
        dto.put("approvedAt", step.getApprovedAt());
        dto.put("remarks", step.getRemarks());
        return dto;
    }

    private Map<String, Object> historyDto(ApprovalHistory history) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("type", "HISTORY");
        dto.put("level", history.getLevel());
        dto.put("approverRole", history.getApproverRole());
        dto.put("status", history.getStatus());
        dto.put("approvedBy", history.getApprovedBy() == null ? null : history.getApprovedBy().getEmail());
        dto.put("approvedAt", history.getApprovedAt());
        dto.put("remarks", history.getRemarks());
        return dto;
    }
}
