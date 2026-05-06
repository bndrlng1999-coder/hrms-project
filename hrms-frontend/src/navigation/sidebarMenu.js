import { PERMISSIONS } from '../auth/authorization';

export const PEOPLE_HR_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'HR'];
export const PROJECT_ROLES = ['SUPER_ADMIN', 'ADMIN', 'CTO', 'PROJECT_MANAGER', 'TEAM_LEAD', 'DEVELOPER', 'INTERN'];
export const CRM_ROLES = ['SUPER_ADMIN', 'ADMIN', 'CEO', 'CTO'];
export const FINANCE_ROLES = ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'HR_MANAGER'];
export const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'];

export const sidebarMenu = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    children: [
      { label: 'Overview', path: '/dashboard', exact: true },
      { label: 'My Profile', path: '/profile', exact: true },
      { label: 'Notifications', path: '/notifications', exact: true },
    ],
  },
  {
    id: 'people-hr',
    label: 'People & HR',
    icon: 'people',
    requiredRoles: PEOPLE_HR_ROLES,
    children: [
      { label: 'Employees', path: '/employees', requiredPermissions: [PERMISSIONS.EMPLOYEE_VIEW_ALL] },
      { label: 'Add Employee', path: '/employees/add', exact: true, requiredRoles: ['SUPER_ADMIN'], requiredPermissions: [PERMISSIONS.USER_CREATE] },
      { label: 'Interns', path: '/interns', exact: true, requiredPermissions: [PERMISSIONS.INTERN_CREATE, PERMISSIONS.EMPLOYEE_VIEW_ALL] },
      { label: 'Attendance', path: '/attendance', exact: true, requiredPermissions: [PERMISSIONS.ATTENDANCE_VIEW, PERMISSIONS.ATTENDANCE_MANAGE] },
      { label: 'Attendance Approvals', path: '/attendance/approvals', requiredPermissions: [PERMISSIONS.ATTENDANCE_APPROVE, PERMISSIONS.ATTENDANCE_MANAGE] },
      { label: 'Leave Management', path: '/leave', requiredPermissions: [PERMISSIONS.LEAVE_APPLY, PERMISSIONS.LEAVE_APPROVE] },
      { label: 'Holidays', path: '/attendance/holidays', requiredPermissions: [PERMISSIONS.ATTENDANCE_VIEW, PERMISSIONS.ATTENDANCE_MANAGE, PERMISSIONS.HOLIDAY_CREATE, PERMISSIONS.HOLIDAY_UPDATE] },
      { label: 'Shift Timings', path: '/attendance/shifts', requiredPermissions: [PERMISSIONS.SHIFT_CREATE, PERMISSIONS.SHIFT_ASSIGN, PERMISSIONS.ATTENDANCE_MANAGE] },
      { label: 'Announcements', path: '/announcements' },
      { label: 'Helpdesk', path: '/helpdesk' },
    ],
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: 'projects',
    requiredRoles: PROJECT_ROLES,
    children: [
      { label: 'Project Dashboard', path: '/projects/dashboard', requiredPermissions: [PERMISSIONS.PROJECT_MANAGE, PERMISSIONS.PROJECT_CREATE, PERMISSIONS.PROJECT_UPDATE, PERMISSIONS.ISSUE_UPDATE] },
      { label: 'Projects', path: '/projects', exact: true, requiredPermissions: [PERMISSIONS.PROJECT_MANAGE, PERMISSIONS.PROJECT_CREATE, PERMISSIONS.PROJECT_UPDATE] },
      { label: 'Create Project', path: '/projects/create', exact: true, requiredPermissions: [PERMISSIONS.PROJECT_CREATE, PERMISSIONS.PROJECT_MANAGE] },
      { label: 'Sprints', path: '/projects/sprints', requiredPermissions: [PERMISSIONS.PROJECT_MANAGE, PERMISSIONS.SPRINT_CREATE, PERMISSIONS.SPRINT_UPDATE] },
      { label: 'Backlog', path: '/projects/backlog', requiredPermissions: [PERMISSIONS.PROJECT_MANAGE, PERMISSIONS.ISSUE_UPDATE] },
      { label: 'Kanban Board', path: '/projects/board', requiredPermissions: [PERMISSIONS.PROJECT_MANAGE, PERMISSIONS.ISSUE_UPDATE] },
      { label: 'Issues', path: '/projects/issues', requiredPermissions: [PERMISSIONS.ISSUE_CREATE, PERMISSIONS.ISSUE_UPDATE] },
      { label: 'Reports', path: '/projects/reports', requiredPermissions: [PERMISSIONS.REPORT_VIEW] },
    ],
  },
  {
    id: 'crm',
    label: 'CRM',
    icon: 'crm',
    requiredRoles: CRM_ROLES,
    children: [
      { label: 'CRM Dashboard', path: '/crm', exact: true, requiredPermissions: [PERMISSIONS.CRM_VIEW, PERMISSIONS.CRM_MANAGE, PERMISSIONS.CRM_APPROVE] },
      { label: 'Leads', path: '/crm/leads', exact: true, requiredPermissions: [PERMISSIONS.CRM_VIEW, PERMISSIONS.CRM_MANAGE] },
      { label: 'Clients', path: '/crm/clients', exact: true, requiredPermissions: [PERMISSIONS.CRM_VIEW, PERMISSIONS.CRM_MANAGE] },
      { label: 'Deals', path: '/crm/deals', exact: true, requiredPermissions: [PERMISSIONS.CRM_VIEW, PERMISSIONS.CRM_MANAGE] },
      { label: 'Follow-ups', path: '/crm/follow-ups', exact: true, requiredPermissions: [PERMISSIONS.CRM_VIEW, PERMISSIONS.CRM_MANAGE] },
      { label: 'Proposals', path: '/crm/proposals', exact: true, requiredPermissions: [PERMISSIONS.CRM_VIEW, PERMISSIONS.CRM_MANAGE, PERMISSIONS.CRM_APPROVE] },
      { label: 'SLA Tracking', path: '/crm/sla-tracking', exact: true, requiredPermissions: [PERMISSIONS.CRM_VIEW, PERMISSIONS.CRM_MANAGE, PERMISSIONS.CRM_APPROVE] },
      { label: 'CRM Reports', path: '/crm/reports', exact: true, requiredPermissions: [PERMISSIONS.CRM_VIEW, PERMISSIONS.CRM_MANAGE, PERMISSIONS.CRM_APPROVE, PERMISSIONS.REPORT_VIEW] },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: 'finance',
    requiredRoles: FINANCE_ROLES,
    children: [
      { label: 'Payroll', path: '/finance/payroll', exact: true, requiredPermissions: [PERMISSIONS.PAYROLL_VIEW, PERMISSIONS.PAYROLL_MANAGE] },
      { label: 'Salary Structure', path: '/finance/salary-structure', exact: true, requiredPermissions: [PERMISSIONS.PAYROLL_VIEW, PERMISSIONS.PAYROLL_MANAGE] },
      { label: 'Payslips', path: '/payslips', requiredPermissions: [PERMISSIONS.PAYROLL_VIEW, PERMISSIONS.PAYROLL_MANAGE, PERMISSIONS.PAYSLIP_GENERATE] },
      { label: 'Generate Payslip', path: '/finance/generate-payslip', exact: true, requiredPermissions: [PERMISSIONS.PAYSLIP_GENERATE, PERMISSIONS.PAYROLL_MANAGE] },
      { label: 'Payroll Reports', path: '/finance/reports', exact: true, requiredPermissions: [PERMISSIONS.PAYROLL_VIEW, PERMISSIONS.PAYROLL_MANAGE, PERMISSIONS.REPORT_VIEW] },
    ],
  },
  {
    id: 'admin-settings',
    label: 'Admin & Settings',
    icon: 'settings',
    requiredRoles: ADMIN_ROLES,
    children: [
      { label: 'User Management', path: '/admin/users', requiredRoles: ['SUPER_ADMIN'], requiredPermissions: [PERMISSIONS.USER_VIEW, PERMISSIONS.USER_CREATE, PERMISSIONS.USER_UPDATE] },
      { label: 'Roles & Permissions', path: '/admin/roles-permissions', exact: true, requiredRoles: ADMIN_ROLES, requiredPermissions: [PERMISSIONS.ROLE_ASSIGN, PERMISSIONS.SETTINGS_MANAGE] },
      { label: 'Audit Logs', path: '/admin/audit-logs', exact: true, requiredRoles: ADMIN_ROLES, requiredPermissions: [PERMISSIONS.AUDIT_VIEW] },
      { label: 'Internal Mail', path: '/mail/inbox', requiredPermissions: [PERMISSIONS.INTERNAL_MAIL_VIEW], allowOutsideParentAccess: true },
      { label: 'Documents', path: '/documents', requiredRoles: ADMIN_ROLES, requiredPermissions: [PERMISSIONS.EMPLOYEE_VIEW_ALL, PERMISSIONS.EMPLOYEE_VIEW_SELF] },
      { label: 'System Settings', path: '/admin/system-settings', exact: true, requiredRoles: ADMIN_ROLES, requiredPermissions: [PERMISSIONS.SETTINGS_MANAGE] },
    ],
  },
];
