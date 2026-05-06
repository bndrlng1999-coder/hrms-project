package com.nikhilhrms.security;

import java.util.Collections;
import java.util.EnumMap;
import java.util.Set;

import com.nikhilhrms.entity.User;

public final class PermissionRegistry {

    public static final String USER_CREATE = "USER_CREATE";
    public static final String USER_VIEW = "USER_VIEW";
    public static final String USER_UPDATE = "USER_UPDATE";
    public static final String USER_DELETE = "USER_DELETE";
    public static final String ROLE_ASSIGN = "ROLE_ASSIGN";
    public static final String EMPLOYEE_VIEW_ALL = "EMPLOYEE_VIEW_ALL";
    public static final String EMPLOYEE_VIEW_SELF = "EMPLOYEE_VIEW_SELF";
    public static final String EMPLOYEE_CREATE = "EMPLOYEE_CREATE";
    public static final String EMPLOYEE_UPDATE = "EMPLOYEE_UPDATE";
    public static final String EMPLOYEE_DELETE = "EMPLOYEE_DELETE";
    public static final String INTERN_CREATE = "INTERN_CREATE";
    public static final String PAYROLL_VIEW = "PAYROLL_VIEW";
    public static final String PAYROLL_MANAGE = "PAYROLL_MANAGE";
    public static final String PAYSLIP_CREATE = "PAYSLIP_CREATE";
    public static final String PAYSLIP_GENERATE = "PAYSLIP_GENERATE";
    public static final String PAYSLIP_SEND = "PAYSLIP_SEND";
    public static final String LEAVE_APPLY = "LEAVE_APPLY";
    public static final String LEAVE_APPROVE = "LEAVE_APPROVE";
    public static final String ATTENDANCE_VIEW = "ATTENDANCE_VIEW";
    public static final String ATTENDANCE_MANAGE = "ATTENDANCE_MANAGE";
    public static final String ATTENDANCE_APPROVE = "ATTENDANCE_APPROVE";
    public static final String ANNOUNCEMENT_CREATE = "ANNOUNCEMENT_CREATE";
    public static final String ANNOUNCEMENT_UPDATE = "ANNOUNCEMENT_UPDATE";
    public static final String HOLIDAY_CREATE = "HOLIDAY_CREATE";
    public static final String HOLIDAY_UPDATE = "HOLIDAY_UPDATE";
    public static final String SHIFT_CREATE = "SHIFT_CREATE";
    public static final String SHIFT_ASSIGN = "SHIFT_ASSIGN";
    public static final String HELPDESK_REPLY = "HELPDESK_REPLY";
    public static final String HELPDESK_MANAGE = "HELPDESK_MANAGE";
    public static final String PROJECT_CREATE = "PROJECT_CREATE";
    public static final String PROJECT_UPDATE = "PROJECT_UPDATE";
    public static final String PROJECT_MANAGE = "PROJECT_MANAGE";
    public static final String SPRINT_CREATE = "SPRINT_CREATE";
    public static final String SPRINT_UPDATE = "SPRINT_UPDATE";
    public static final String ISSUE_CREATE = "ISSUE_CREATE";
    public static final String ISSUE_ASSIGN = "ISSUE_ASSIGN";
    public static final String ISSUE_UPDATE = "ISSUE_UPDATE";
    public static final String ISSUE_DELETE = "ISSUE_DELETE";
    public static final String INTERNAL_MAIL_SEND = "INTERNAL_MAIL_SEND";
    public static final String INTERNAL_MAIL_VIEW = "INTERNAL_MAIL_VIEW";
    public static final String CRM_VIEW = "CRM_VIEW";
    public static final String CRM_MANAGE = "CRM_MANAGE";
    public static final String CRM_APPROVE = "CRM_APPROVE";
    public static final String REPORT_VIEW = "REPORT_VIEW";
    public static final String SETTINGS_MANAGE = "SETTINGS_MANAGE";
    public static final String AUDIT_VIEW = "AUDIT_VIEW";

    private static final Set<String> ALL_PERMISSIONS = Set.of(
            USER_CREATE, USER_VIEW, USER_UPDATE, USER_DELETE, ROLE_ASSIGN,
            EMPLOYEE_VIEW_ALL, EMPLOYEE_VIEW_SELF, EMPLOYEE_CREATE, EMPLOYEE_UPDATE, EMPLOYEE_DELETE, INTERN_CREATE,
            PAYROLL_VIEW, PAYROLL_MANAGE, PAYSLIP_CREATE, PAYSLIP_GENERATE, PAYSLIP_SEND,
            LEAVE_APPLY, LEAVE_APPROVE,
            ATTENDANCE_VIEW, ATTENDANCE_MANAGE, ATTENDANCE_APPROVE,
            ANNOUNCEMENT_CREATE, ANNOUNCEMENT_UPDATE, HOLIDAY_CREATE, HOLIDAY_UPDATE,
            SHIFT_CREATE, SHIFT_ASSIGN, HELPDESK_REPLY, HELPDESK_MANAGE,
            PROJECT_CREATE, PROJECT_UPDATE, PROJECT_MANAGE, SPRINT_CREATE, SPRINT_UPDATE,
            ISSUE_CREATE, ISSUE_ASSIGN, ISSUE_UPDATE, ISSUE_DELETE,
            INTERNAL_MAIL_SEND, INTERNAL_MAIL_VIEW, CRM_VIEW, CRM_MANAGE, CRM_APPROVE,
            REPORT_VIEW, SETTINGS_MANAGE, AUDIT_VIEW
    );

    private static final EnumMap<User.Role, Set<String>> ROLE_PERMISSIONS = new EnumMap<>(User.Role.class);

    static {
        ROLE_PERMISSIONS.put(User.Role.SUPER_ADMIN, ALL_PERMISSIONS);
        ROLE_PERMISSIONS.put(User.Role.ADMIN, Set.of(
                USER_CREATE, USER_VIEW, USER_UPDATE, ROLE_ASSIGN,
                EMPLOYEE_VIEW_ALL, EMPLOYEE_VIEW_SELF, EMPLOYEE_CREATE, EMPLOYEE_UPDATE, INTERN_CREATE,
                ANNOUNCEMENT_CREATE, ANNOUNCEMENT_UPDATE, HOLIDAY_CREATE, HOLIDAY_UPDATE,
                SHIFT_CREATE, SHIFT_ASSIGN, HELPDESK_REPLY, HELPDESK_MANAGE,
                ATTENDANCE_VIEW, ATTENDANCE_MANAGE, ATTENDANCE_APPROVE,
                LEAVE_APPLY, LEAVE_APPROVE, REPORT_VIEW, SETTINGS_MANAGE, AUDIT_VIEW,
                PROJECT_CREATE, PROJECT_UPDATE, PROJECT_MANAGE, SPRINT_CREATE, SPRINT_UPDATE,
                ISSUE_CREATE, ISSUE_ASSIGN, ISSUE_UPDATE, INTERNAL_MAIL_VIEW, INTERNAL_MAIL_SEND,
                PAYROLL_VIEW, PAYSLIP_CREATE, PAYSLIP_GENERATE, PAYSLIP_SEND,
                CRM_VIEW, CRM_MANAGE
        ));
        ROLE_PERMISSIONS.put(User.Role.CEO, Set.of(
                EMPLOYEE_VIEW_ALL, PROJECT_MANAGE, PROJECT_UPDATE, REPORT_VIEW, PAYROLL_VIEW, INTERNAL_MAIL_VIEW, INTERNAL_MAIL_SEND,
                CRM_VIEW, CRM_APPROVE
        ));
        ROLE_PERMISSIONS.put(User.Role.CTO, Set.of(
                EMPLOYEE_VIEW_ALL, PROJECT_CREATE, PROJECT_UPDATE, PROJECT_MANAGE, SPRINT_CREATE, SPRINT_UPDATE,
                ISSUE_CREATE, ISSUE_ASSIGN, ISSUE_UPDATE, ISSUE_DELETE, REPORT_VIEW, INTERNAL_MAIL_VIEW, INTERNAL_MAIL_SEND,
                CRM_VIEW, CRM_MANAGE
        ));
        ROLE_PERMISSIONS.put(User.Role.HR_MANAGER, Set.of(
                USER_CREATE, USER_VIEW, USER_UPDATE, EMPLOYEE_CREATE, EMPLOYEE_VIEW_ALL,
                EMPLOYEE_UPDATE, INTERN_CREATE, LEAVE_APPLY, LEAVE_APPROVE,
                ATTENDANCE_VIEW, ATTENDANCE_MANAGE, ATTENDANCE_APPROVE,
                ANNOUNCEMENT_CREATE, ANNOUNCEMENT_UPDATE, HOLIDAY_CREATE, HOLIDAY_UPDATE,
                SHIFT_CREATE, SHIFT_ASSIGN, HELPDESK_REPLY, HELPDESK_MANAGE,
                PAYROLL_VIEW, REPORT_VIEW, INTERNAL_MAIL_VIEW, INTERNAL_MAIL_SEND
        ));
        ROLE_PERMISSIONS.put(User.Role.HR, Set.of(
                USER_CREATE, USER_VIEW, EMPLOYEE_CREATE, EMPLOYEE_VIEW_ALL, EMPLOYEE_UPDATE,
                INTERN_CREATE, LEAVE_APPLY, LEAVE_APPROVE, ATTENDANCE_VIEW, ATTENDANCE_APPROVE,
                HELPDESK_REPLY, INTERNAL_MAIL_VIEW, INTERNAL_MAIL_SEND
        ));
        ROLE_PERMISSIONS.put(User.Role.PROJECT_MANAGER, Set.of(
                EMPLOYEE_VIEW_ALL, PROJECT_CREATE, PROJECT_UPDATE, PROJECT_MANAGE,
                SPRINT_CREATE, SPRINT_UPDATE, ISSUE_CREATE, ISSUE_ASSIGN,
                ISSUE_UPDATE, REPORT_VIEW, INTERNAL_MAIL_VIEW, INTERNAL_MAIL_SEND
        ));
        ROLE_PERMISSIONS.put(User.Role.TEAM_LEAD, Set.of(
                EMPLOYEE_VIEW_ALL, PROJECT_CREATE, PROJECT_UPDATE, PROJECT_MANAGE,
                SPRINT_CREATE, SPRINT_UPDATE, ISSUE_CREATE, ISSUE_ASSIGN, ISSUE_UPDATE,
                REPORT_VIEW, INTERNAL_MAIL_VIEW, INTERNAL_MAIL_SEND
        ));
        ROLE_PERMISSIONS.put(User.Role.DEVELOPER, employeeTaskPermissions());
        ROLE_PERMISSIONS.put(User.Role.MARKETING_MANAGER, Set.of(
                PROJECT_CREATE, PROJECT_UPDATE, PROJECT_MANAGE, SPRINT_CREATE, SPRINT_UPDATE,
                ISSUE_CREATE, ISSUE_ASSIGN, ISSUE_UPDATE,
                REPORT_VIEW, INTERNAL_MAIL_VIEW, INTERNAL_MAIL_SEND, EMPLOYEE_VIEW_SELF,
                ATTENDANCE_VIEW, LEAVE_APPLY, PAYROLL_VIEW
        ));
        ROLE_PERMISSIONS.put(User.Role.MARKETING_EXECUTIVE, employeeTaskPermissions());
        ROLE_PERMISSIONS.put(User.Role.FINANCE, Set.of(
                PAYROLL_VIEW, PAYROLL_MANAGE, PAYSLIP_CREATE, PAYSLIP_GENERATE, PAYSLIP_SEND,
                REPORT_VIEW, INTERNAL_MAIL_VIEW, INTERNAL_MAIL_SEND,
                EMPLOYEE_VIEW_SELF, EMPLOYEE_UPDATE, ATTENDANCE_VIEW, LEAVE_APPLY
        ));
        ROLE_PERMISSIONS.put(User.Role.INTERN, Set.of(
                EMPLOYEE_VIEW_SELF, LEAVE_APPLY, ISSUE_UPDATE, INTERNAL_MAIL_VIEW
        ));
        ROLE_PERMISSIONS.put(User.Role.EMPLOYEE, Set.of(
                EMPLOYEE_VIEW_SELF, ATTENDANCE_VIEW, LEAVE_APPLY, PAYROLL_VIEW,
                ISSUE_CREATE, ISSUE_UPDATE, INTERNAL_MAIL_VIEW, INTERNAL_MAIL_SEND
        ));
        ROLE_PERMISSIONS.put(User.Role.MANAGER, ROLE_PERMISSIONS.get(User.Role.PROJECT_MANAGER));
    }

    private PermissionRegistry() {
    }

    public static Set<String> permissionsFor(User.Role role) {
        return ROLE_PERMISSIONS.getOrDefault(role, Collections.emptySet());
    }

    public static Set<String> allPermissions() {
        return ALL_PERMISSIONS;
    }

    public static Set<String> defaultPermissionsFor(User.Role role) {
        return permissionsFor(role);
    }

    private static Set<String> employeeTaskPermissions() {
        return Set.of(
                EMPLOYEE_VIEW_SELF, ATTENDANCE_VIEW, LEAVE_APPLY, PAYROLL_VIEW,
                ISSUE_CREATE, ISSUE_UPDATE, INTERNAL_MAIL_VIEW, INTERNAL_MAIL_SEND
        );
    }

    private static Set<String> except(String... denied) {
        Set<String> permissions = new java.util.HashSet<>(ALL_PERMISSIONS);
        for (String permission : denied) {
            permissions.remove(permission);
        }
        return Collections.unmodifiableSet(permissions);
    }
}
