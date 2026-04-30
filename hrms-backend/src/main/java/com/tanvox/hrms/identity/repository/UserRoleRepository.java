package com.tanvox.hrms.identity.repository;

import com.tanvox.hrms.identity.entity.User;
import com.tanvox.hrms.identity.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, Long> {
    @Query("SELECT ur FROM UserRole ur WHERE ur.user.id = ?1 AND ur.isDeleted = false")
    List<UserRole> findActiveByUserId(Long userId);

    @Query("SELECT ur FROM UserRole ur WHERE ur.user = ?1 AND ur.isDeleted = false")
    List<UserRole> findActiveByUser(User user);

    boolean existsByUserIdAndRoleIdAndIsDeletedFalse(Long userId, Long roleId);
}
