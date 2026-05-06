export const PERMISSIONS = {
  USER_CREATE: 'USER_CREATE',
  USER_VIEW: 'USER_VIEW',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',
  ROLE_ASSIGN: 'ROLE_ASSIGN',
  EMPLOYEE_VIEW_ALL: 'EMPLOYEE_VIEW_ALL',
  EMPLOYEE_VIEW_SELF: 'EMPLOYEE_VIEW_SELF',
  EMPLOYEE_CREATE: 'EMPLOYEE_CREATE',
  EMPLOYEE_UPDATE: 'EMPLOYEE_UPDATE',
  EMPLOYEE_DELETE: 'EMPLOYEE_DELETE',
  INTERN_CREATE: 'INTERN_CREATE',
  PAYROLL_VIEW: 'PAYROLL_VIEW',
  PAYROLL_MANAGE: 'PAYROLL_MANAGE',
  PAYSLIP_CREATE: 'PAYSLIP_CREATE',
  PAYSLIP_GENERATE: 'PAYSLIP_GENERATE',
  PAYSLIP_SEND: 'PAYSLIP_SEND',
  LEAVE_APPLY: 'LEAVE_APPLY',
  LEAVE_APPROVE: 'LEAVE_APPROVE',
  ATTENDANCE_VIEW: 'ATTENDANCE_VIEW',
  ATTENDANCE_MANAGE: 'ATTENDANCE_MANAGE',
  ATTENDANCE_APPROVE: 'ATTENDANCE_APPROVE',
  ANNOUNCEMENT_CREATE: 'ANNOUNCEMENT_CREATE',
  ANNOUNCEMENT_UPDATE: 'ANNOUNCEMENT_UPDATE',
  HOLIDAY_CREATE: 'HOLIDAY_CREATE',
  HOLIDAY_UPDATE: 'HOLIDAY_UPDATE',
  SHIFT_CREATE: 'SHIFT_CREATE',
  SHIFT_ASSIGN: 'SHIFT_ASSIGN',
  HELPDESK_REPLY: 'HELPDESK_REPLY',
  HELPDESK_MANAGE: 'HELPDESK_MANAGE',
  PROJECT_CREATE: 'PROJECT_CREATE',
  PROJECT_UPDATE: 'PROJECT_UPDATE',
  PROJECT_MANAGE: 'PROJECT_MANAGE',
  SPRINT_CREATE: 'SPRINT_CREATE',
  SPRINT_UPDATE: 'SPRINT_UPDATE',
  ISSUE_CREATE: 'ISSUE_CREATE',
  ISSUE_ASSIGN: 'ISSUE_ASSIGN',
  ISSUE_UPDATE: 'ISSUE_UPDATE',
  ISSUE_DELETE: 'ISSUE_DELETE',
  INTERNAL_MAIL_SEND: 'INTERNAL_MAIL_SEND',
  INTERNAL_MAIL_VIEW: 'INTERNAL_MAIL_VIEW',
  CRM_VIEW: 'CRM_VIEW',
  CRM_MANAGE: 'CRM_MANAGE',
  CRM_APPROVE: 'CRM_APPROVE',
  REPORT_VIEW: 'REPORT_VIEW',
  SETTINGS_MANAGE: 'SETTINGS_MANAGE',
  AUDIT_VIEW: 'AUDIT_VIEW',
};

export const getUserPermissions = (user) => {
  if (!user) return [];
  if (Array.isArray(user.permissions)) return user.permissions;
  return [];
};

export const hasPermission = (user, requiredPermissions = []) => {
  if (!requiredPermissions.length) return true;
  const permissions = new Set(getUserPermissions(user));
  return requiredPermissions.some((permission) => permissions.has(permission));
};

export const hasRole = (user, requiredRoles = []) => {
  if (!requiredRoles.length) return true;
  return Boolean(user?.role && requiredRoles.includes(user.role));
};

export const canAccess = (user, { requiredRoles = [], requiredPermissions = [] } = {}) => {
  if (!requiredRoles.length && !requiredPermissions.length) return true;
  if (requiredRoles.length && !hasRole(user, requiredRoles)) return false;
  if (requiredPermissions.length && !hasPermission(user, requiredPermissions)) return false;
  return true;
};

export const filterNavigationItems = (items, user, parentCanAccess = true) => {
  return items.reduce((visibleItems, item) => {
    const itemCanAccess = canAccess(user, item);
    const canShowAtThisLevel = parentCanAccess && itemCanAccess;

    if (item.children?.length) {
      const visibleChildren = item.children.filter((child) => {
        const childCanAccess = canAccess(user, child);
        return (canShowAtThisLevel && childCanAccess) || (child.allowOutsideParentAccess && childCanAccess);
      });

      if (canShowAtThisLevel || visibleChildren.length) {
        visibleItems.push({ ...item, children: visibleChildren });
      }

      return visibleItems;
    }

    if (canShowAtThisLevel) {
      visibleItems.push(item);
    }

    return visibleItems;
  }, []);
};
