package com.nikhilhrms.config;

import com.nikhilhrms.entity.*;
import com.nikhilhrms.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

@Configuration
public class ProjectTrackerSeedData {

    @Bean
    CommandLineRunner seedProjectTracker(
            ProjectRepository projectRepository,
            ProjectMemberRepository projectMemberRepository,
            SprintRepository sprintRepository,
            IssueRepository issueRepository,
            IssueCommentRepository issueCommentRepository,
            IssueActivityRepository issueActivityRepository,
            JdbcTemplate jdbcTemplate,
            UserRepository userRepository,
            EmployeeRepository employeeRepository
    ) {
        return args -> {
            jdbcTemplate.execute("ALTER TABLE users MODIFY role ENUM('SUPER_ADMIN','ADMIN','CEO','CTO','HR_MANAGER','HR','PROJECT_MANAGER','TEAM_LEAD','DEVELOPER','MARKETING_MANAGER','MARKETING_EXECUTIVE','FINANCE','INTERN','EMPLOYEE','MANAGER') NOT NULL");

            userRepository.findByEmail("hr@tanvox.com").ifPresent(user -> {
                if (user.getRole() != User.Role.HR) {
                    user.setRole(User.Role.HR);
                    userRepository.save(user);
                }
            });

            if (projectRepository.count() > 0 || employeeRepository.count() < 6) {
                return;
            }

            List<Employee> employees = employeeRepository.findAll();
            Employee nikhil = employees.get(0);
            Employee hr = employees.get(1);
            Employee manager = employees.get(2);
            Employee salesManager = employees.get(3);
            Employee engineer = employees.get(4);
            Employee engineerTwo = employees.get(5);

            Project hrms = createProject(projectRepository, "Tanvox HRMS Platform", "HRMS",
                    "Internal HR portal expansion for payroll, leave, attendance, and project collaboration.",
                    LocalDate.now().minusMonths(2), LocalDate.now().plusMonths(4), nikhil, Project.Status.ACTIVE);
            Project web = createProject(projectRepository, "Tanvox Website Refresh", "WEB",
                    "Public website improvements, lead capture pages, and performance cleanup.",
                    LocalDate.now().minusWeeks(3), LocalDate.now().plusMonths(2), salesManager, Project.Status.ACTIVE);

            addMembers(projectMemberRepository, hrms, Arrays.asList(nikhil, hr, manager, engineer, engineerTwo));
            addMembers(projectMemberRepository, web, Arrays.asList(nikhil, salesManager, engineer, engineerTwo));

            Sprint sprint1 = createSprint(sprintRepository, "HRMS Sprint 1 - Core Flow", hrms, "Stabilize employee workflows",
                    LocalDate.now().minusDays(10), LocalDate.now().plusDays(4), Sprint.Status.ACTIVE);
            Sprint sprint2 = createSprint(sprintRepository, "HRMS Sprint 2 - Reports", hrms, "Deliver project status reporting",
                    LocalDate.now().plusDays(5), LocalDate.now().plusDays(19), Sprint.Status.PLANNED);
            Sprint sprint3 = createSprint(sprintRepository, "Website Sprint 1 - Launch Prep", web, "Prepare pages for launch review",
                    LocalDate.now().minusDays(3), LocalDate.now().plusDays(11), Sprint.Status.ACTIVE);

            Object[][] seedIssues = new Object[][]{
                    {hrms, sprint1, "Build project tracker navigation", Issue.IssueType.STORY, Issue.Priority.HIGH, Issue.Status.DONE, engineer, nikhil, 5, "navigation,project-tracker"},
                    {hrms, sprint1, "Create employee workload report", Issue.IssueType.TASK, Issue.Priority.MEDIUM, Issue.Status.IN_PROGRESS, engineerTwo, manager, 3, "reports"},
                    {hrms, sprint1, "Fix leave approval activity log", Issue.IssueType.BUG, Issue.Priority.HIGH, Issue.Status.IN_REVIEW, engineer, hr, 2, "leave,audit"},
                    {hrms, sprint1, "Design sprint summary cards", Issue.IssueType.TASK, Issue.Priority.LOW, Issue.Status.TODO, engineerTwo, nikhil, 2, "dashboard"},
                    {hrms, sprint2, "Add notification preferences", Issue.IssueType.STORY, Issue.Priority.MEDIUM, Issue.Status.TODO, engineer, hr, 5, "notifications"},
                    {hrms, sprint2, "Export project report CSV", Issue.IssueType.TASK, Issue.Priority.LOW, Issue.Status.TODO, engineerTwo, manager, 3, "reports,export"},
                    {hrms, null, "Review role permissions matrix", Issue.IssueType.TASK, Issue.Priority.CRITICAL, Issue.Status.TODO, manager, nikhil, 2, "security"},
                    {hrms, null, "Document onboarding checklist", Issue.IssueType.STORY, Issue.Priority.MEDIUM, Issue.Status.TODO, hr, hr, 3, "docs"},
                    {web, sprint3, "Audit homepage responsiveness", Issue.IssueType.BUG, Issue.Priority.HIGH, Issue.Status.IN_PROGRESS, engineer, salesManager, 3, "frontend"},
                    {web, sprint3, "Create pricing page content slots", Issue.IssueType.TASK, Issue.Priority.MEDIUM, Issue.Status.TODO, engineerTwo, salesManager, 2, "content"},
                    {web, sprint3, "Improve contact form validation", Issue.IssueType.BUG, Issue.Priority.CRITICAL, Issue.Status.IN_REVIEW, engineer, nikhil, 3, "forms"},
                    {web, sprint3, "Prepare launch checklist epic", Issue.IssueType.EPIC, Issue.Priority.HIGH, Issue.Status.TODO, salesManager, nikhil, 8, "launch"},
                    {web, null, "Research careers page layout", Issue.IssueType.STORY, Issue.Priority.LOW, Issue.Status.TODO, engineerTwo, hr, 3, "careers"},
                    {hrms, sprint1, "Add backlog quick-create form", Issue.IssueType.TASK, Issue.Priority.MEDIUM, Issue.Status.DONE, engineer, manager, 2, "backlog"},
                    {hrms, null, "Investigate duplicate attendance entries", Issue.IssueType.BUG, Issue.Priority.HIGH, Issue.Status.TODO, engineerTwo, hr, 3, "attendance"}
            };

            for (Object[] item : seedIssues) {
                Issue issue = new Issue();
                issue.setProject((Project) item[0]);
                issue.setSprint((Sprint) item[1]);
                issue.setTitle((String) item[2]);
                issue.setDescription("Seeded tracker item for Tanvox internal project planning.");
                issue.setIssueType((Issue.IssueType) item[3]);
                issue.setPriority((Issue.Priority) item[4]);
                issue.setStatus((Issue.Status) item[5]);
                issue.setAssignee((Employee) item[6]);
                issue.setReporter((Employee) item[7]);
                issue.setStoryPoints((Integer) item[8]);
                issue.setLabels((String) item[9]);
                issue.setDueDate(LocalDate.now().plusDays(issue.getStatus() == Issue.Status.DONE ? -2 : 7));
                issue = issueRepository.save(issue);

                IssueActivity created = new IssueActivity();
                created.setIssue(issue);
                created.setActor(issue.getReporter());
                created.setActivityType("CREATED");
                created.setDescription("Issue created");
                issueActivityRepository.save(created);

                IssueComment comment = new IssueComment();
                comment.setIssue(issue);
                comment.setAuthor(issue.getReporter());
                comment.setComment("Initial planning note added for this work item.");
                issueCommentRepository.save(comment);
            }
        };
    }

    private Project createProject(ProjectRepository repository, String name, String key, String description,
                                  LocalDate start, LocalDate end, Employee lead, Project.Status status) {
        Project project = new Project();
        project.setName(name);
        project.setProjectKey(key);
        project.setDescription(description);
        project.setStartDate(start);
        project.setEndDate(end);
        project.setLead(lead);
        project.setStatus(status);
        return repository.save(project);
    }

    private Sprint createSprint(SprintRepository repository, String name, Project project, String goal,
                                LocalDate start, LocalDate end, Sprint.Status status) {
        Sprint sprint = new Sprint();
        sprint.setName(name);
        sprint.setProject(project);
        sprint.setGoal(goal);
        sprint.setStartDate(start);
        sprint.setEndDate(end);
        sprint.setStatus(status);
        return repository.save(sprint);
    }

    private void addMembers(ProjectMemberRepository repository, Project project, List<Employee> employees) {
        for (Employee employee : employees) {
            ProjectMember member = new ProjectMember();
            member.setProject(project);
            member.setEmployee(employee);
            repository.save(member);
        }
    }
}
