package com.tanvox.hrms.identity.dto;

import com.tanvox.hrms.common.dto.BaseDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Permission DTO for API responses and requests.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermissionDTO extends BaseDTO {
    private Long id;
    private String code;
    private String name;
    private String description;
    private String module;
    private Boolean isActive;
}
