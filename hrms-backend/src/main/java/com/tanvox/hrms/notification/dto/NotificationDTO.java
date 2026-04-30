package com.tanvox.hrms.notification.dto;

import com.tanvox.hrms.common.dto.BaseDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Notification DTO for API responses.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO extends BaseDTO {
    private Long id;
    private Long recipientUserId;
    private String type;
    private String title;
    private String message;
    private String actionUrl;
    private Boolean isRead;
    private Long relatedEntityId;
    private String relatedEntityType;
}
