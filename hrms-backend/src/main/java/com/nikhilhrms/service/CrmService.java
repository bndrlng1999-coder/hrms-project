package com.nikhilhrms.service;

import com.nikhilhrms.entity.*;
import com.nikhilhrms.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CrmService {

    private static final Set<User.Role> CRM_ROLES = EnumSet.of(User.Role.SUPER_ADMIN, User.Role.ADMIN, User.Role.CEO, User.Role.CTO);
    private static final BigDecimal CEO_APPROVAL_THRESHOLD = new BigDecimal("1000000");

    private final CrmLeadRepository leadRepository;
    private final CrmClientRepository clientRepository;
    private final CrmDealRepository dealRepository;
    private final CrmFollowUpRepository followUpRepository;
    private final CrmProposalRepository proposalRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final ApprovalWorkflowService approvalWorkflowService;

    @Value("${crm.sla.new-lead-contact-hours:4}")
    private long newLeadContactHours;

    @Value("${crm.sla.follow-up-response-hours:24}")
    private long followUpResponseHours;

    public CrmService(
            CrmLeadRepository leadRepository,
            CrmClientRepository clientRepository,
            CrmDealRepository dealRepository,
            CrmFollowUpRepository followUpRepository,
            CrmProposalRepository proposalRepository,
            EmployeeRepository employeeRepository,
            UserRepository userRepository,
            NotificationRepository notificationRepository,
            ApprovalWorkflowService approvalWorkflowService
    ) {
        this.leadRepository = leadRepository;
        this.clientRepository = clientRepository;
        this.dealRepository = dealRepository;
        this.followUpRepository = followUpRepository;
        this.proposalRepository = proposalRepository;
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.approvalWorkflowService = approvalWorkflowService;
    }

    public List<Map<String, Object>> getLeads() {
        requireCrmAccess();
        return leadRepository.findAll().stream().map(this::leadDto).collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> createLead(Map<String, Object> request) {
        Employee actor = currentEmployee();
        requireCrmAccess(actor);
        CrmLead lead = new CrmLead();
        applyLead(lead, request, actor);
        resetSla(lead);
        return leadDto(leadRepository.save(lead));
    }

    @Transactional
    public Map<String, Object> updateLead(Long id, Map<String, Object> request) {
        Employee actor = currentEmployee();
        requireCrmAccess(actor);
        CrmLead lead = leadRepository.findById(id).orElseThrow(() -> new RuntimeException("Lead not found"));
        CrmLead.LeadStatus oldStatus = lead.getStatus();
        applyLead(lead, request, actor);
        if (oldStatus != lead.getStatus()) {
            if (lead.getStatus() == CrmLead.LeadStatus.CONTACTED) {
                lead.setLastContactedAt(LocalDateTime.now());
            }
            if (lead.getStatus() == CrmLead.LeadStatus.FOLLOW_UP) {
                resetSla(lead);
            }
        }
        updateSlaStatus(lead, LocalDateTime.now());
        lead.setUpdatedAt(LocalDateTime.now());
        return leadDto(leadRepository.save(lead));
    }

    public List<Map<String, Object>> getClients() {
        requireCrmAccess();
        return clientRepository.findAll().stream().map(this::clientDto).collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> createClient(Map<String, Object> request) {
        Employee actor = currentEmployee();
        requireCrmAccess(actor);
        CrmClient client = new CrmClient();
        client.setName(stringValue(request, "name", null));
        client.setCompany(stringValue(request, "company", null));
        client.setEmail(stringValue(request, "email", null));
        client.setPhone(stringValue(request, "phone", null));
        client.setOwner(actor);
        return clientDto(clientRepository.save(client));
    }

    public List<Map<String, Object>> getDeals() {
        requireCrmAccess();
        return dealRepository.findAll().stream().map(this::dealDto).collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> createDeal(Map<String, Object> request) {
        Employee actor = currentEmployee();
        requireCrmAccess(actor);
        CrmDeal deal = new CrmDeal();
        applyDeal(deal, request, actor);
        deal = dealRepository.save(deal);
        maybeCreateCeoApproval(deal, actor);
        return dealDto(deal);
    }

    @Transactional
    public Map<String, Object> createFollowUp(Map<String, Object> request) {
        Employee actor = currentEmployee();
        requireCrmAccess(actor);
        CrmLead lead = leadRepository.findById(longValue(request, "leadId", null))
                .orElseThrow(() -> new RuntimeException("Lead not found"));
        CrmFollowUp followUp = new CrmFollowUp();
        followUp.setLead(lead);
        followUp.setOwner(actor);
        followUp.setFollowUpAt(dateTimeValue(request, "followUpAt", LocalDateTime.now().plusHours(followUpResponseHours)));
        followUp.setNotes(stringValue(request, "notes", null));
        lead.setStatus(CrmLead.LeadStatus.FOLLOW_UP);
        lead.setNextFollowUpAt(followUp.getFollowUpAt());
        resetSla(lead);
        leadRepository.save(lead);
        return followUpDto(followUpRepository.save(followUp));
    }

    @Transactional
    public Map<String, Object> createProposal(Map<String, Object> request) {
        requireCrmAccess();
        CrmDeal deal = dealRepository.findById(longValue(request, "dealId", null))
                .orElseThrow(() -> new RuntimeException("Deal not found"));
        CrmProposal proposal = new CrmProposal();
        proposal.setDeal(deal);
        proposal.setTitle(stringValue(request, "title", "Proposal"));
        proposal.setContent(stringValue(request, "content", ""));
        return proposalDto(proposalRepository.save(proposal));
    }

    public Map<String, Object> slaReport() {
        requireCrmAccess();
        List<CrmLead> leads = leadRepository.findAll();
        Map<String, Long> byStatus = leads.stream()
                .collect(Collectors.groupingBy(lead -> lead.getSlaStatus().name(), TreeMap::new, Collectors.counting()));
        long contacted = leads.stream().filter(lead -> lead.getLastContactedAt() != null).count();
        double averageResponseMinutes = leads.stream()
                .filter(lead -> lead.getLastContactedAt() != null)
                .mapToLong(lead -> Duration.between(lead.getSlaStartTime(), lead.getLastContactedAt()).toMinutes())
                .average()
                .orElse(0);
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("totalLeads", leads.size());
        report.put("contactedLeads", contacted);
        report.put("slaByStatus", byStatus);
        report.put("averageResponseMinutes", Math.round(averageResponseMinutes));
        return report;
    }

    @Scheduled(fixedDelayString = "${crm.sla.scheduler-delay-ms:300000}")
    @Transactional
    public void refreshLeadSlaStatuses() {
        LocalDateTime now = LocalDateTime.now();
        for (CrmLead lead : leadRepository.findByStatusNotIn(List.of(CrmLead.LeadStatus.CONVERTED, CrmLead.LeadStatus.LOST))) {
            CrmLead.SlaStatus old = lead.getSlaStatus();
            updateSlaStatus(lead, now);
            if (old != lead.getSlaStatus()) {
                leadRepository.save(lead);
                if (lead.getSlaStatus() == CrmLead.SlaStatus.BREACHED) {
                    notifySlaBreach(lead);
                }
            }
        }
    }

    private void applyLead(CrmLead lead, Map<String, Object> request, Employee actor) {
        lead.setName(stringValue(request, "name", lead.getName()));
        lead.setCompany(stringValue(request, "company", lead.getCompany()));
        lead.setEmail(stringValue(request, "email", lead.getEmail()));
        lead.setPhone(stringValue(request, "phone", lead.getPhone()));
        lead.setNotes(stringValue(request, "notes", lead.getNotes()));
        lead.setStatus(CrmLead.LeadStatus.valueOf(stringValue(request, "status", lead.getStatus().name())));
        Long assignedToId = longValue(request, "assignedToId", lead.getAssignedTo() == null ? actor.getId() : lead.getAssignedTo().getId());
        lead.setAssignedTo(employeeRepository.findById(assignedToId).orElse(actor));
    }

    private void applyDeal(CrmDeal deal, Map<String, Object> request, Employee actor) {
        deal.setTitle(stringValue(request, "title", deal.getTitle()));
        deal.setOwner(actor);
        deal.setValue(decimalValue(request, "value", deal.getValue()));
        deal.setExpectedCloseDate(dateValue(request, "expectedCloseDate", deal.getExpectedCloseDate()));
        Long leadId = longValue(request, "leadId", null);
        if (leadId != null) {
            deal.setLead(leadRepository.findById(leadId).orElseThrow(() -> new RuntimeException("Lead not found")));
        }
        Long clientId = longValue(request, "clientId", null);
        if (clientId != null) {
            deal.setClient(clientRepository.findById(clientId).orElseThrow(() -> new RuntimeException("Client not found")));
        }
        if (deal.getValue() != null && deal.getValue().compareTo(CEO_APPROVAL_THRESHOLD) >= 0) {
            deal.setStatus(CrmDeal.DealStatus.CEO_APPROVAL_PENDING);
        }
    }

    private void maybeCreateCeoApproval(CrmDeal deal, Employee actor) {
        if (deal.getStatus() == CrmDeal.DealStatus.CEO_APPROVAL_PENDING) {
            approvalWorkflowService.createWorkflow(
                    ApprovalWorkflow.Module.CRM,
                    deal.getId(),
                    actor.getUser().getEmail(),
                    "High value CRM deal: " + deal.getTitle() + " (" + deal.getValue() + ")",
                    List.of(User.Role.CEO)
            );
        }
    }

    private void resetSla(CrmLead lead) {
        LocalDateTime now = LocalDateTime.now();
        lead.setSlaStartTime(now);
        long hours = lead.getStatus() == CrmLead.LeadStatus.FOLLOW_UP ? followUpResponseHours : newLeadContactHours;
        lead.setSlaDueTime(now.plusHours(hours));
        lead.setSlaStatus(CrmLead.SlaStatus.ON_TIME);
    }

    private void updateSlaStatus(CrmLead lead, LocalDateTime now) {
        if (lead.getSlaDueTime() == null) {
            resetSla(lead);
        }
        if (lead.getStatus() == CrmLead.LeadStatus.CONTACTED || lead.getStatus() == CrmLead.LeadStatus.CONVERTED || lead.getStatus() == CrmLead.LeadStatus.LOST) {
            lead.setSlaStatus(CrmLead.SlaStatus.ON_TIME);
            return;
        }
        if (!now.isBefore(lead.getSlaDueTime())) {
            lead.setSlaStatus(CrmLead.SlaStatus.BREACHED);
            return;
        }
        long totalMinutes = Math.max(1, Duration.between(lead.getSlaStartTime(), lead.getSlaDueTime()).toMinutes());
        long remainingMinutes = Duration.between(now, lead.getSlaDueTime()).toMinutes();
        lead.setSlaStatus(remainingMinutes <= totalMinutes / 4 ? CrmLead.SlaStatus.AT_RISK : CrmLead.SlaStatus.ON_TIME);
    }

    private void notifySlaBreach(CrmLead lead) {
        if (lead.getAssignedTo() != null) {
            createNotification(lead.getAssignedTo(), "CRM SLA breached", lead.getName() + " has breached SLA.", "/crm/leads");
            if (lead.getAssignedTo().getManagerId() != null) {
                employeeRepository.findById(lead.getAssignedTo().getManagerId())
                        .ifPresent(manager -> createNotification(manager, "Team CRM SLA breached", lead.getName() + " assigned to " + fullName(lead.getAssignedTo()) + " breached SLA.", "/crm/reports"));
            }
        }
    }

    private void createNotification(Employee recipient, String title, String message, String link) {
        Notification notification = new Notification();
        notification.setRecipient(recipient);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setLink(link);
        notificationRepository.save(notification);
    }

    private void requireCrmAccess() {
        requireCrmAccess(currentEmployee());
    }

    private void requireCrmAccess(Employee employee) {
        if (!CRM_ROLES.contains(employee.getUser().getRole())) {
            throw new RuntimeException("CRM access is restricted to ADMIN, CEO, CTO and SUPER_ADMIN");
        }
    }

    private Employee currentEmployee() {
        String email = String.valueOf(SecurityContextHolder.getContext().getAuthentication().getPrincipal());
        return employeeRepository.findByUserEmail(email).orElseThrow(() -> new RuntimeException("Employee profile not found"));
    }

    private Map<String, Object> leadDto(CrmLead lead) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", lead.getId());
        dto.put("name", lead.getName());
        dto.put("company", lead.getCompany());
        dto.put("email", lead.getEmail());
        dto.put("phone", lead.getPhone());
        dto.put("status", lead.getStatus());
        dto.put("notes", lead.getNotes());
        dto.put("assignedToId", lead.getAssignedTo() == null ? null : lead.getAssignedTo().getId());
        dto.put("assignedToName", fullName(lead.getAssignedTo()));
        dto.put("slaStartTime", lead.getSlaStartTime());
        dto.put("slaDueTime", lead.getSlaDueTime());
        dto.put("slaStatus", lead.getSlaStatus());
        dto.put("lastContactedAt", lead.getLastContactedAt());
        dto.put("nextFollowUpAt", lead.getNextFollowUpAt());
        return dto;
    }

    private Map<String, Object> clientDto(CrmClient client) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", client.getId());
        dto.put("name", client.getName());
        dto.put("company", client.getCompany());
        dto.put("email", client.getEmail());
        dto.put("phone", client.getPhone());
        dto.put("ownerName", fullName(client.getOwner()));
        return dto;
    }

    private Map<String, Object> dealDto(CrmDeal deal) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", deal.getId());
        dto.put("title", deal.getTitle());
        dto.put("value", deal.getValue());
        dto.put("status", deal.getStatus());
        dto.put("leadName", deal.getLead() == null ? null : deal.getLead().getName());
        dto.put("clientName", deal.getClient() == null ? null : deal.getClient().getName());
        dto.put("ownerName", fullName(deal.getOwner()));
        dto.put("expectedCloseDate", deal.getExpectedCloseDate());
        return dto;
    }

    private Map<String, Object> followUpDto(CrmFollowUp followUp) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", followUp.getId());
        dto.put("leadId", followUp.getLead().getId());
        dto.put("leadName", followUp.getLead().getName());
        dto.put("followUpAt", followUp.getFollowUpAt());
        dto.put("notes", followUp.getNotes());
        dto.put("completed", followUp.getCompleted());
        return dto;
    }

    private Map<String, Object> proposalDto(CrmProposal proposal) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", proposal.getId());
        dto.put("dealId", proposal.getDeal().getId());
        dto.put("title", proposal.getTitle());
        dto.put("status", proposal.getStatus());
        return dto;
    }

    private String fullName(Employee employee) {
        return employee == null ? null : employee.getFirstName() + " " + employee.getLastName();
    }

    private String stringValue(Map<String, Object> map, String key, String fallback) {
        Object value = map.get(key);
        return value == null || String.valueOf(value).isBlank() ? fallback : String.valueOf(value);
    }

    private Long longValue(Map<String, Object> map, String key, Long fallback) {
        Object value = map.get(key);
        return value == null || String.valueOf(value).isBlank() ? fallback : Long.valueOf(String.valueOf(value));
    }

    private BigDecimal decimalValue(Map<String, Object> map, String key, BigDecimal fallback) {
        Object value = map.get(key);
        return value == null || String.valueOf(value).isBlank() ? fallback : new BigDecimal(String.valueOf(value));
    }

    private LocalDate dateValue(Map<String, Object> map, String key, LocalDate fallback) {
        Object value = map.get(key);
        return value == null || String.valueOf(value).isBlank() ? fallback : LocalDate.parse(String.valueOf(value));
    }

    private LocalDateTime dateTimeValue(Map<String, Object> map, String key, LocalDateTime fallback) {
        Object value = map.get(key);
        return value == null || String.valueOf(value).isBlank() ? fallback : LocalDateTime.parse(String.valueOf(value));
    }
}
