package com.tanvox.hrms.identity.repository;

import com.tanvox.hrms.identity.entity.RefreshToken;
import com.tanvox.hrms.identity.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);

    @Query("SELECT rt FROM RefreshToken rt WHERE rt.token = ?1 AND rt.isDeleted = false")
    Optional<RefreshToken> findActiveByToken(String token);

    @Query("SELECT rt FROM RefreshToken rt WHERE rt.user = ?1 AND rt.isDeleted = false")
    Optional<RefreshToken> findActiveByUser(User user);

    void deleteByExpiryDateBefore(LocalDateTime now);

    void deleteByUserAndIsRevokedTrue(User user);
}
