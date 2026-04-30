package com.nikhilhrms.repository;

import com.nikhilhrms.entity.IssueAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IssueAttachmentRepository extends JpaRepository<IssueAttachment, Long> {
    List<IssueAttachment> findByIssueId(Long issueId);
    void deleteByIssueId(Long issueId);
}
