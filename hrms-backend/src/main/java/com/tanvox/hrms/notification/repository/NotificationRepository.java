package com.tanvox.hrms.notification.repository;

import com.tanvox.hrms.notification.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @Query("SELECT n FROM Notification n WHERE n.recipientUserId = ?1 AND n.isDeleted = false ORDER BY n.createdAt DESC")
    Page<Notification> findByRecipientUserId(Long recipientUserId, Pageable pageable);

    @Query("SELECT n FROM Notification n WHERE n.recipientUserId = ?1 AND n.isRead = false AND n.isDeleted = false")
    Page<Notification> findUnreadByRecipientUserId(Long recipientUserId, Pageable pageable);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.recipientUserId = ?1 AND n.isRead = false AND n.isDeleted = false")
    long countUnreadByRecipientUserId(Long recipientUserId);
}
