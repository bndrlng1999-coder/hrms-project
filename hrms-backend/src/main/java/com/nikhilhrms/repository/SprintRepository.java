package com.nikhilhrms.repository;

import com.nikhilhrms.entity.Sprint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SprintRepository extends JpaRepository<Sprint, Long> {
    List<Sprint> findByProjectId(Long projectId);
    List<Sprint> findByStatus(Sprint.Status status);
    void deleteByProjectId(Long projectId);
}
