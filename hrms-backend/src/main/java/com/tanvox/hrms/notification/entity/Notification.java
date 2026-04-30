package com.tanvox.hrms.notification.entity;

import com.tanvox.hrms.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Notification entity for in-app notifications.
 */
@Entity
@Table(name = "notifications", indexes = {
    @Index(name = "idx_recipient_id", columnList = "recipient_user_id"),
    @Index(name = "idx_is_read", columnList = "is_read"),
    @Index(name = "idx_type", columnList = "type")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "recipient_user_id", nullable = false)
    private Long recipientUserId;

    @Column(nullable = false, length = 100)
    private String type;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "LONGTEXT")
    private String message;

    @Column(length = 500)
    private String actionUrl;

    @Column(nullable = false)
    private Boolean isRead = false;

    @Column(name = "related_entity_id")
    private Long relatedEntityId;

    @Column(name = "related_entity_type", length = 100)
    private String relatedEntityType;

    // Notification types
    public static final class NotificationType {
        public static final String TASK_ASSIGNED = "TASK_ASSIGNED";
        public static final String LEAVE_APPROVED = "LEAVE_APPROVED";
        public static final String LEAVE_REJECTED = "LEAVE_REJECTED";
        public static final String PAYROLL_GENERATED = "PAYROLL_GENERATED";
        public static final String INTERNAL_MAIL = "INTERNAL_MAIL";
        public static final String ANNOUNCEMENT = "ANNOUNCEMENT";
        public static final String APPROVAL_PENDING = "APPROVAL_PENDING";
        public static final String SYSTEM_ALERT = "SYSTEM_ALERT";
    }
}
