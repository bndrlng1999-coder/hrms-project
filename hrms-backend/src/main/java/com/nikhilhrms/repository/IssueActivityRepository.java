package com.nikhilhrms.repository;

import com.nikhilhrms.entity.IssueActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IssueActivityRepository extends JpaRepository<IssueActivity, Long> {
    List<IssueActivity> findByIssueIdOrderByCreatedAtAsc(Long issueId);
    void deleteByIssueId(Long issueId);
}
