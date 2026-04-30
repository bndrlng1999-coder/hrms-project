package com.nikhilhrms.repository;

import com.nikhilhrms.entity.Issue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface IssueRepository extends JpaRepository<Issue, Long> {
    List<Issue> findByProjectId(Long projectId);
    List<Issue> findBySprintId(Long sprintId);
    List<Issue> findBySprintIsNull();
    List<Issue> findByAssigneeId(Long assigneeId);
    void deleteByProjectId(Long projectId);
    long countByStatus(Issue.Status status);
    long countByIssueType(Issue.IssueType issueType);
    long countByDueDateBeforeAndStatusNot(LocalDate dueDate, Issue.Status status);

    @Query("select i.status, count(i) from Issue i group by i.status")
    List<Object[]> countByStatusGroup();

    @Query("select i.priority, count(i) from Issue i group by i.priority")
    List<Object[]> countByPriorityGroup();

    @Query("select i.assignee.id, concat(i.assignee.firstName, ' ', i.assignee.lastName), count(i) from Issue i where i.assignee is not null group by i.assignee.id, i.assignee.firstName, i.assignee.lastName")
    List<Object[]> countByAssigneeGroup();
}
