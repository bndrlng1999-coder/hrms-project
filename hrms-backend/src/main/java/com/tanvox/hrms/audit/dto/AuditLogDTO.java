package com.tanvox.hrms.audit.dto;

import com.tanvox.hrms.common.dto.BaseDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Audit Log DTO for API responses.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogDTO extends BaseDTO {
    private Long id;
    private Long actorUserId;
    private String actorEmail;
    private String action;
    private String module;
    private Long entityId;
    private String entityType;
    private String oldValue;
    private String newValue;
    private String ipAddress;
    private String userAgent;
    private String description;
    private String status;
}
