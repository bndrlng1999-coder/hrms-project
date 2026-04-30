package com.nikhilhrms.service;

import com.nikhilhrms.entity.*;
import com.nikhilhrms.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProjectTrackerService {

    private static final Set<User.Role> PROJECT_MANAGERS = EnumSet.of(
            User.Role.SUPER_ADMIN,
            User.Role.ADMIN,
            User.Role.CTO,
            User.Role.HR_MANAGER,
            User.Role.PROJECT_MANAGER,
            User.Role.MARKETING_MANAGER,
            User.Role.MANAGER
    );

    private static final Set<User.Role> SPRINT_MANAGERS = EnumSet.of(
            User.Role.SUPER_ADMIN,
            User.Role.ADMIN,
            User.Role.CTO,
            User.Role.PROJECT_MANAGER,
            User.Role.TEAM_LEAD,
            User.Role.MARKETING_MANAGER,
            User.Role.MANAGER
    );

    private static final Set<User.Role> PRIORITY_MANAGERS = EnumSet.of(
            User.Role.SUPER_ADMIN,
            User.Role.ADMIN,
            User.Role.PROJECT_MANAGER,
            User.Role.TEAM_LEAD
    );

    @Autowired private ProjectRepository projectRepository;
    @Autowired private ProjectMemberRepository projectMemberRepository;
    @Autowired private IssueRepository issueRepository;
    @Autowired private SprintRepository sprintRepository;
    @Autowired private IssueCommentRepository issueCommentRepository;
    @Autowired private IssueActivityRepository issueActivityRepository;
    @Autowired private IssueAttachmentRepository issueAttachmentRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private EmployeeRepository employeeRepository;
    @Autowired private UserRepository userRepository;

    public List<Map<String, Object>> getProjects() {
        return projectRepository.findAll().stream().map(this::projectDto).collect(Collectors.toList());
    }

    public Map<String, Object> getProject(Long id) {
        return projectDto(getProjectEntity(id));
    }

    @Transactional
    public Map<String, Object> createProject(Map<String, Object> request) {
        requireProjectCreator();
        Project project = new Project();
        applyProject(project, request);
        project = projectRepository.save(project);
        syncMembers(project, request);
        return projectDto(project);
    }

    @Transactional
    public Map<String, Object> updateProject(Long id, Map<String, Object> request) {
        requireProjectCreator();
        Project project = getProjectEntity(id);
        applyProject(project, request);
        project.setUpdatedAt(LocalDateTime.now());
        project = projectRepository.save(project);
        syncMembers(project, request);
        return projectDto(project);
    }

    @Transactional
    public void deleteProject(Long id) {
        requireProjectCreator();
        getProjectEntity(id);
        for (Issue issue : issueRepository.findByProjectId(id)) {
            issueCommentRepository.deleteByIssueId(issue.getId());
            issueActivityRepository.deleteByIssueId(issue.getId());
            issueAttachmentRepository.deleteByIssueId(issue.getId());
        }
        issueRepository.deleteByProjectId(id);
        sprintRepository.deleteByProjectId(id);
        projectMemberRepository.deleteByProjectId(id);
        projectRepository.deleteById(id);
    }

    public List<Map<String, Object>> getProjectMembers(Long projectId) {
        return projectMemberRepository.findByProjectId(projectId).stream()
                .map(ProjectMember::getEmployee)
                .map(this::employeeDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<Map<String, Object>> updateProjectMembers(Long projectId, Map<String, Object> request) {
        requireProjectCreator();
        Project project = getProjectEntity(projectId);
        syncMembers(project, request);
        return getProjectMembers(projectId);
    }

    public List<Map<String, Object>> getIssues(Map<String, String> filters) {
        List<Issue> issues;
        if (filters.containsKey("projectId")) {
            issues = issueRepository.findByProjectId(Long.valueOf(filters.get("projectId")));
        } else if ("true".equalsIgnoreCase(filters.get("backlog"))) {
            issues = issueRepository.findBySprintIsNull();
        } else {
            issues = issueRepository.findAll();
        }

        return issues.stream()
                .filter(issue -> matches(filters.get("assigneeId"), issue.getAssignee() == null ? null : issue.getAssignee().getId()))
                .filter(issue -> matches(filters.get("priority"), issue.getPriority().name()))
                .filter(issue -> matches(filters.get("issueType"), issue.getIssueType().name()))
                .filter(issue -> matches(filters.get("status"), issue.getStatus().name()))
                .map(this::issueDto)
                .collect(Collectors.toList());
    }

    public Map<String, Object> getIssue(Long id) {
        return issueDto(getIssueEntity(id));
    }

    @Transactional
    public Map<String, Object> createIssue(Map<String, Object> request) {
        Employee actor = currentEmployee();
        Issue issue = new Issue();
        issue.setReporter(actor);
        applyIssue(issue, request, actor);
        issue = issueRepository.save(issue);
        addActivity(issue, actor, "CREATED", "Issue created");
        notifyAssignee(issue, "Issue assigned", issue.getTitle() + " was assigned to you");
        return issueDto(issue);
    }

    @Transactional
    public Map<String, Object> updateIssue(Long id, Map<String, Object> request) {
        Employee actor = currentEmployee();
        Issue issue = getIssueEntity(id);
        requireIssueEditor(issue, actor);
        String oldAssignee = employeeName(issue.getAssignee());
        Issue.Priority oldPriority = issue.getPriority();
        applyIssue(issue, request, actor);
        issue.setUpdatedAt(LocalDateTime.now());
        issue = issueRepository.save(issue);
        if (!Objects.equals(oldAssignee, employeeName(issue.getAssignee()))) {
            addActivity(issue, actor, "ASSIGNEE_CHANGED", "Assignee changed from " + valueOrDash(oldAssignee) + " to " + valueOrDash(employeeName(issue.getAssignee())));
            notifyAssignee(issue, "Issue assigned", issue.getTitle() + " was assigned to you");
        }
        if (oldPriority != issue.getPriority()) {
            addActivity(issue, actor, "PRIORITY_CHANGED", "Priority changed from " + oldPriority + " to " + issue.getPriority());
        }
        return issueDto(issue);
    }

    @Transactional
    public Map<String, Object> updateIssueStatus(Long id, Map<String, Object> request) {
        Employee actor = currentEmployee();
        Issue issue = getIssueEntity(id);
        requireIssueEditor(issue, actor);
        Issue.Status oldStatus = issue.getStatus();
        Issue.Status newStatus = Issue.Status.valueOf(stringValue(request, "status", oldStatus.name()));
        issue.setStatus(newStatus);
        issue.setUpdatedAt(LocalDateTime.now());
        issue = issueRepository.save(issue);
        if (oldStatus != newStatus) {
            addActivity(issue, actor, "STATUS_CHANGED", "Status changed from " + oldStatus + " to " + newStatus);
            notifyReporter(issue, "Issue status changed", issue.getTitle() + " moved to " + newStatus);
        }
        return issueDto(issue);
    }

    @Transactional
    public Map<String, Object> addComment(Long issueId, Map<String, Object> request) {
        Employee actor = currentEmployee();
        Issue issue = getIssueEntity(issueId);
        IssueComment comment = new IssueComment();
        comment.setIssue(issue);
        comment.setAuthor(actor);
        comment.setComment(stringValue(request, "comment", ""));
        comment = issueCommentRepository.save(comment);
        addActivity(issue, actor, "COMMENT_ADDED", "Comment added");
        return commentDto(comment);
    }

    public List<Map<String, Object>> getComments(Long issueId) {
        return issueCommentRepository.findByIssueIdOrderByCreatedAtAsc(issueId).stream()
                .map(this::commentDto)
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getActivity(Long issueId) {
        return issueActivityRepository.findByIssueIdOrderByCreatedAtAsc(issueId).stream()
                .map(this::activityDto)
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getSprints(Map<String, String> filters) {
        List<Sprint> sprints = filters.containsKey("projectId")
                ? sprintRepository.findByProjectId(Long.valueOf(filters.get("projectId")))
                : sprintRepository.findAll();
        return sprints.stream().map(this::sprintDto).collect(Collectors.toList());
    }

    public Map<String, Object> getSprint(Long id) {
        return sprintDto(getSprintEntity(id));
    }

    @Transactional
    public Map<String, Object> createSprint(Map<String, Object> request) {
        requireSprintCreator();
        Sprint sprint = new Sprint();
        applySprint(sprint, request);
        return sprintDto(sprintRepository.save(sprint));
    }

    @Transactional
    public Map<String, Object> updateSprint(Long id, Map<String, Object> request) {
        requireSprintCreator();
        Sprint sprint = getSprintEntity(id);
        applySprint(sprint, request);
        sprint.setUpdatedAt(LocalDateTime.now());
        return sprintDto(sprintRepository.save(sprint));
    }

    @Transactional
    public Map<String, Object> startSprint(Long id) {
        requireSprintCreator();
        Sprint sprint = getSprintEntity(id);
        sprint.setStatus(Sprint.Status.ACTIVE);
        sprint.setUpdatedAt(LocalDateTime.now());
        return sprintDto(sprintRepository.save(sprint));
    }

    @Transactional
    public Map<String, Object> completeSprint(Long id) {
        requireSprintCreator();
        Sprint sprint = getSprintEntity(id);
        sprint.setStatus(Sprint.Status.COMPLETED);
        sprint.setUpdatedAt(LocalDateTime.now());
        issueRepository.findBySprintId(id).stream()
                .filter(issue -> issue.getStatus() != Issue.Status.DONE)
                .forEach(issue -> issue.setSprint(null));
        return sprintDto(sprintRepository.save(sprint));
    }

    public Map<String, Object> getReports() {
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("totalProjects", projectRepository.count());
        report.put("openIssues", issueRepository.findAll().stream().filter(i -> i.getStatus() != Issue.Status.DONE).count());
        report.put("completedIssues", issueRepository.countByStatus(Issue.Status.DONE));
        report.put("bugsCount", issueRepository.countByIssueType(Issue.IssueType.BUG));
        report.put("activeSprint", sprintRepository.findByStatus(Sprint.Status.ACTIVE).stream().findFirst().map(this::sprintDto).orElse(null));
        report.put("overdueTasks", issueRepository.countByDueDateBeforeAndStatusNot(LocalDate.now(), Issue.Status.DONE));
        report.put("issuesByStatus", grouped(issueRepository.countByStatusGroup()));
        report.put("issuesByPriority", grouped(issueRepository.countByPriorityGroup()));
        report.put("employeeWorkload", issueRepository.countByAssigneeGroup().stream().map(row -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("employeeId", row[0]);
            item.put("employeeName", row[1]);
            item.put("issueCount", row[2]);
            return item;
        }).collect(Collectors.toList()));
        return report;
    }

    public List<Map<String, Object>> getNotifications() {
        Employee employee = currentEmployee();
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(employee.getId()).stream()
                .map(this::notificationDto)
                .collect(Collectors.toList());
    }

    private void applyProject(Project project, Map<String, Object> request) {
        project.setName(stringValue(request, "name", project.getName()));
        project.setProjectKey(stringValue(request, "projectKey", project.getProjectKey()));
        project.setDescription(stringValue(request, "description", project.getDescription()));
        project.setStartDate(dateValue(request, "startDate", project.getStartDate()));
        project.setEndDate(dateValue(request, "endDate", project.getEndDate()));
        project.setStatus(Project.Status.valueOf(stringValue(request, "status", project.getStatus().name())));
        if (request.containsKey("priority")) {
            requirePriorityManager();
            project.setPriority(Project.Priority.valueOf(stringValue(request, "priority", project.getPriority().name())));
        }
        Long leadId = longValue(request, "leadId", project.getLead() == null ? null : project.getLead().getId());
        if (leadId != null) {
            project.setLead(getEmployeeEntity(leadId));
        }
    }

    private void syncMembers(Project project, Map<String, Object> request) {
        if (!request.containsKey("memberIds")) {
            if (project.getLead() != null) {
                addMember(project, project.getLead());
            }
            return;
        }
        for (ProjectMember member : projectMemberRepository.findByProjectId(project.getId())) {
            projectMemberRepository.delete(member);
        }
        List<?> memberIds = (List<?>) request.get("memberIds");
        if (project.getLead() != null) {
            addMember(project, project.getLead());
        }
        for (Object memberId : memberIds) {
            addMember(project, getEmployeeEntity(asLong(memberId)));
        }
    }

    private void addMember(Project project, Employee employee) {
        projectMemberRepository.findByProjectIdAndEmployeeId(project.getId(), employee.getId()).orElseGet(() -> {
            ProjectMember member = new ProjectMember();
            member.setProject(project);
            member.setEmployee(employee);
            return projectMemberRepository.save(member);
        });
    }

    private void applyIssue(Issue issue, Map<String, Object> request, Employee actor) {
        issue.setTitle(stringValue(request, "title", issue.getTitle()));
        issue.setDescription(stringValue(request, "description", issue.getDescription()));
        issue.setIssueType(Issue.IssueType.valueOf(stringValue(request, "issueType", issue.getIssueType().name())));
        if (request.containsKey("priority")) {
            if (issue.getId() == null || PRIORITY_MANAGERS.contains(actor.getUser().getRole())) {
                issue.setPriority(Issue.Priority.valueOf(stringValue(request, "priority", issue.getPriority().name())));
            } else {
                requirePriorityManager();
            }
        }
        issue.setStatus(Issue.Status.valueOf(stringValue(request, "status", issue.getStatus().name())));
        issue.setDueDate(dateValue(request, "dueDate", issue.getDueDate()));
        issue.setStoryPoints(integerValue(request, "storyPoints", issue.getStoryPoints()));
        issue.setLabels(stringValue(request, "labels", issue.getLabels()));
        Long projectId = longValue(request, "projectId", issue.getProject() == null ? null : issue.getProject().getId());
        if (projectId != null) {
            issue.setProject(getProjectEntity(projectId));
        }
        Long sprintId = longValue(request, "sprintId", issue.getSprint() == null ? null : issue.getSprint().getId());
        issue.setSprint(sprintId == null ? null : getSprintEntity(sprintId));
        Long assigneeId = longValue(request, "assigneeId", issue.getAssignee() == null ? null : issue.getAssignee().getId());
        issue.setAssignee(assigneeId == null ? null : getEmployeeEntity(assigneeId));
        if (issue.getReporter() == null) {
            issue.setReporter(actor);
        }
    }

    private void applySprint(Sprint sprint, Map<String, Object> request) {
        sprint.setName(stringValue(request, "name", sprint.getName()));
        sprint.setProject(getProjectEntity(longValue(request, "projectId", sprint.getProject() == null ? null : sprint.getProject().getId())));
        sprint.setStartDate(dateValue(request, "startDate", sprint.getStartDate()));
        sprint.setEndDate(dateValue(request, "endDate", sprint.getEndDate()));
        sprint.setGoal(stringValue(request, "goal", sprint.getGoal()));
        sprint.setStatus(Sprint.Status.valueOf(stringValue(request, "status", sprint.getStatus().name())));
    }

    private void addActivity(Issue issue, Employee actor, String type, String description) {
        IssueActivity activity = new IssueActivity();
        activity.setIssue(issue);
        activity.setActor(actor);
        activity.setActivityType(type);
        activity.setDescription(description);
        issueActivityRepository.save(activity);
    }

    private void notifyAssignee(Issue issue, String title, String message) {
        if (issue.getAssignee() != null) {
            createNotification(issue.getAssignee(), title, message, "/project-tracker/issues/" + issue.getId());
        }
    }

    private void notifyReporter(Issue issue, String title, String message) {
        if (issue.getReporter() != null) {
            createNotification(issue.getReporter(), title, message, "/project-tracker/issues/" + issue.getId());
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

    private Map<String, Object> projectDto(Project project) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", project.getId());
        dto.put("name", project.getName());
        dto.put("projectKey", project.getProjectKey());
        dto.put("description", project.getDescription());
        dto.put("startDate", project.getStartDate());
        dto.put("endDate", project.getEndDate());
        dto.put("leadId", project.getLead() == null ? null : project.getLead().getId());
        dto.put("leadName", employeeName(project.getLead()));
        dto.put("status", project.getStatus());
        dto.put("priority", project.getPriority());
        dto.put("members", getProjectMembers(project.getId()));
        dto.put("createdAt", project.getCreatedAt());
        return dto;
    }

    private Map<String, Object> sprintDto(Sprint sprint) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", sprint.getId());
        dto.put("name", sprint.getName());
        dto.put("projectId", sprint.getProject().getId());
        dto.put("projectName", sprint.getProject().getName());
        dto.put("projectKey", sprint.getProject().getProjectKey());
        dto.put("startDate", sprint.getStartDate());
        dto.put("endDate", sprint.getEndDate());
        dto.put("goal", sprint.getGoal());
        dto.put("status", sprint.getStatus());
        long total = issueRepository.findBySprintId(sprint.getId()).size();
        long done = issueRepository.findBySprintId(sprint.getId()).stream().filter(i -> i.getStatus() == Issue.Status.DONE).count();
        dto.put("totalIssues", total);
        dto.put("completedIssues", done);
        return dto;
    }

    private Map<String, Object> issueDto(Issue issue) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", issue.getId());
        dto.put("title", issue.getTitle());
        dto.put("description", issue.getDescription());
        dto.put("issueType", issue.getIssueType());
        dto.put("priority", issue.getPriority());
        dto.put("status", issue.getStatus());
        dto.put("assigneeId", issue.getAssignee() == null ? null : issue.getAssignee().getId());
        dto.put("assigneeName", employeeName(issue.getAssignee()));
        dto.put("reporterId", issue.getReporter().getId());
        dto.put("reporterName", employeeName(issue.getReporter()));
        dto.put("projectId", issue.getProject().getId());
        dto.put("projectName", issue.getProject().getName());
        dto.put("projectKey", issue.getProject().getProjectKey());
        dto.put("issueKey", issue.getProject().getProjectKey() + "-" + issue.getId());
        dto.put("sprintId", issue.getSprint() == null ? null : issue.getSprint().getId());
        dto.put("sprintName", issue.getSprint() == null ? null : issue.getSprint().getName());
        dto.put("dueDate", issue.getDueDate());
        dto.put("storyPoints", issue.getStoryPoints());
        dto.put("labels", issue.getLabels());
        dto.put("createdAt", issue.getCreatedAt());
        dto.put("updatedAt", issue.getUpdatedAt());
        dto.put("attachments", issueAttachmentRepository.findByIssueId(issue.getId()).stream().map(this::attachmentDto).collect(Collectors.toList()));
        return dto;
    }

    private Map<String, Object> employeeDto(Employee employee) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", employee.getId());
        dto.put("name", employeeName(employee));
        dto.put("email", employee.getUser().getEmail());
        dto.put("employeeCode", employee.getEmployeeCode());
        dto.put("role", employee.getUser().getRole());
        return dto;
    }

    private Map<String, Object> commentDto(IssueComment comment) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", comment.getId());
        dto.put("issueId", comment.getIssue().getId());
        dto.put("authorId", comment.getAuthor().getId());
        dto.put("authorName", employeeName(comment.getAuthor()));
        dto.put("comment", comment.getComment());
        dto.put("createdAt", comment.getCreatedAt());
        return dto;
    }

    private Map<String, Object> activityDto(IssueActivity activity) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", activity.getId());
        dto.put("issueId", activity.getIssue().getId());
        dto.put("actorName", employeeName(activity.getActor()));
        dto.put("activityType", activity.getActivityType());
        dto.put("description", activity.getDescription());
        dto.put("createdAt", activity.getCreatedAt());
        return dto;
    }

    private Map<String, Object> attachmentDto(IssueAttachment attachment) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", attachment.getId());
        dto.put("fileName", attachment.getFileName());
        dto.put("fileUrl", attachment.getFileUrl());
        dto.put("uploadedBy", employeeName(attachment.getUploadedBy()));
        dto.put("createdAt", attachment.getCreatedAt());
        return dto;
    }

    private Map<String, Object> notificationDto(Notification notification) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", notification.getId());
        dto.put("title", notification.getTitle());
        dto.put("message", notification.getMessage());
        dto.put("link", notification.getLink());
        dto.put("readFlag", notification.getReadFlag());
        dto.put("createdAt", notification.getCreatedAt());
        return dto;
    }

    private Map<String, Object> grouped(List<Object[]> rows) {
        Map<String, Object> grouped = new LinkedHashMap<>();
        for (Object[] row : rows) {
            grouped.put(String.valueOf(row[0]), row[1]);
        }
        return grouped;
    }

    private Project getProjectEntity(Long id) {
        return projectRepository.findById(id).orElseThrow(() -> new RuntimeException("Project not found"));
    }

    private Sprint getSprintEntity(Long id) {
        return sprintRepository.findById(id).orElseThrow(() -> new RuntimeException("Sprint not found"));
    }

    private Issue getIssueEntity(Long id) {
        return issueRepository.findById(id).orElseThrow(() -> new RuntimeException("Issue not found"));
    }

    private Employee getEmployeeEntity(Long id) {
        return employeeRepository.findById(id).orElseThrow(() -> new RuntimeException("Employee not found"));
    }

    public Employee currentEmployee() {
        String email = String.valueOf(SecurityContextHolder.getContext().getAuthentication().getPrincipal());
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        return employeeRepository.findByUserId(user.getId()).orElseThrow(() -> new RuntimeException("Employee not found"));
    }

    private void requireProjectCreator() {
        User.Role role = currentEmployee().getUser().getRole();
        if (!PROJECT_MANAGERS.contains(role)) {
            throw new RuntimeException("You do not have permission to manage projects");
        }
    }

    private void requireSprintCreator() {
        User.Role role = currentEmployee().getUser().getRole();
        if (!SPRINT_MANAGERS.contains(role)) {
            throw new RuntimeException("You do not have permission to manage sprints");
        }
    }

    private void requireIssueEditor(Issue issue, Employee actor) {
        User.Role role = actor.getUser().getRole();
        boolean elevated = PROJECT_MANAGERS.contains(role) || role == User.Role.TEAM_LEAD;
        boolean assigned = issue.getAssignee() != null && Objects.equals(issue.getAssignee().getId(), actor.getId());
        boolean reporter = Objects.equals(issue.getReporter().getId(), actor.getId());
        if (!(elevated || assigned || reporter)) {
            throw new RuntimeException("You can update only issues assigned to or reported by you");
        }
    }

    private void requirePriorityManager() {
        User.Role role = currentEmployee().getUser().getRole();
        if (!PRIORITY_MANAGERS.contains(role)) {
            throw new RuntimeException("Only ADMIN, PROJECT_MANAGER, TEAM_LEAD or SUPER_ADMIN can change priority");
        }
    }

    private boolean matches(String filter, Object value) {
        return filter == null || filter.isBlank() || Objects.equals(String.valueOf(value), filter);
    }

    private String employeeName(Employee employee) {
        return employee == null ? null : employee.getFirstName() + " " + employee.getLastName();
    }

    private String valueOrDash(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }

    private String stringValue(Map<String, Object> map, String key, String fallback) {
        Object value = map.get(key);
        return value == null || String.valueOf(value).isBlank() ? fallback : String.valueOf(value);
    }

    private LocalDate dateValue(Map<String, Object> map, String key, LocalDate fallback) {
        Object value = map.get(key);
        return value == null || String.valueOf(value).isBlank() ? fallback : LocalDate.parse(String.valueOf(value));
    }

    private Long longValue(Map<String, Object> map, String key, Long fallback) {
        Object value = map.get(key);
        return value == null || String.valueOf(value).isBlank() ? fallback : asLong(value);
    }

    private Long asLong(Object value) {
        return value instanceof Number ? ((Number) value).longValue() : Long.valueOf(String.valueOf(value));
    }

    private Integer integerValue(Map<String, Object> map, String key, Integer fallback) {
        Object value = map.get(key);
        return value == null || String.valueOf(value).isBlank() ? fallback : Integer.valueOf(String.valueOf(value));
    }
}
