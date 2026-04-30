import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS, hasPermission } from '../auth/authorization';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  const can = (...permissions) => hasPermission(user, permissions);

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'DB', show: true },
    { path: '/employees', label: 'Employees', icon: 'EM', show: can(PERMISSIONS.EMPLOYEE_VIEW_ALL) },
    { path: '/admin/users', label: 'Admin Users', icon: 'US', show: user?.role === 'SUPER_ADMIN' },
    { path: '/attendance', label: 'Attendance', icon: 'AT', show: can(PERMISSIONS.ATTENDANCE_VIEW, PERMISSIONS.ATTENDANCE_MANAGE) },
    { path: '/attendance/approvals', label: 'Attendance Approvals', icon: 'AP', show: can(PERMISSIONS.ATTENDANCE_APPROVE, PERMISSIONS.ATTENDANCE_MANAGE) },
    { path: '/attendance/reports', label: 'Attendance Reports', icon: 'AR', show: can(PERMISSIONS.ATTENDANCE_MANAGE, PERMISSIONS.ATTENDANCE_APPROVE, PERMISSIONS.REPORT_VIEW) },
    { path: '/attendance/shifts', label: 'Shifts & Holidays', icon: 'SH', show: can(PERMISSIONS.SHIFT_CREATE, PERMISSIONS.SHIFT_ASSIGN, PERMISSIONS.HOLIDAY_CREATE, PERMISSIONS.ATTENDANCE_MANAGE) },
    { path: '/leave', label: 'Leave', icon: 'LV', show: can(PERMISSIONS.LEAVE_APPLY, PERMISSIONS.LEAVE_APPROVE) },
    { path: '/payslips', label: 'Payslips', icon: 'PY', show: can(PERMISSIONS.PAYROLL_VIEW, PERMISSIONS.PAYROLL_MANAGE, PERMISSIONS.PAYSLIP_GENERATE) },
    { path: '/announcements', label: 'Announcements', icon: 'AN', show: true },
    { path: '/helpdesk', label: 'Helpdesk', icon: 'HD', show: true },
    { path: '/documents', label: 'Documents', icon: 'DO', show: can(PERMISSIONS.EMPLOYEE_VIEW_SELF, PERMISSIONS.EMPLOYEE_VIEW_ALL) },
    { path: '/mail/inbox', label: 'Internal Mail', icon: 'ML', show: can(PERMISSIONS.INTERNAL_MAIL_VIEW) },
    { path: '/approvals', label: 'Approvals', icon: 'AQ', show: true },
    { path: '/crm', label: 'CRM', icon: 'CR', show: can(PERMISSIONS.CRM_VIEW, PERMISSIONS.CRM_MANAGE, PERMISSIONS.CRM_APPROVE) },
    { path: '/project-tracker/dashboard', label: 'Project Tracker', icon: 'PT', show: can(PERMISSIONS.PROJECT_MANAGE, PERMISSIONS.PROJECT_CREATE, PERMISSIONS.PROJECT_UPDATE, PERMISSIONS.ISSUE_UPDATE) },
    { path: '/project-tracker/projects', label: 'Projects', icon: 'PR', show: can(PERMISSIONS.PROJECT_MANAGE, PERMISSIONS.PROJECT_CREATE, PERMISSIONS.PROJECT_UPDATE) },
    { path: '/project-tracker/board', label: 'Board', icon: 'BD', show: can(PERMISSIONS.PROJECT_MANAGE, PERMISSIONS.ISSUE_UPDATE) },
    { path: '/project-tracker/backlog', label: 'Backlog', icon: 'BL', show: can(PERMISSIONS.PROJECT_MANAGE, PERMISSIONS.ISSUE_UPDATE) },
    { path: '/project-tracker/sprints', label: 'Sprints', icon: 'SP', show: can(PERMISSIONS.PROJECT_MANAGE, PERMISSIONS.SPRINT_CREATE, PERMISSIONS.SPRINT_UPDATE) },
    { path: '/project-tracker/issues', label: 'Issues', icon: 'IS', show: can(PERMISSIONS.ISSUE_CREATE, PERMISSIONS.ISSUE_UPDATE) },
    { path: '/project-tracker/reports', label: 'Reports', icon: 'RP', show: can(PERMISSIONS.REPORT_VIEW) },
  ];

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <aside className="fixed left-0 top-16 z-30 hidden h-[calc(100vh-4rem)] w-64 overflow-y-auto border-r border-primary-800/70 bg-primary-900 text-white shadow-xl lg:block">
      <div className="p-4">
        <div className="mb-6 rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-primary-200">Signed in</div>
          <div className="mt-2 truncate text-sm font-semibold text-white">{user?.email}</div>
          <div className="mt-1 text-xs text-primary-100">{user?.role}</div>
        </div>

        <nav className="space-y-1.5">
          {menuItems.map((item) =>
            item.show ? (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center rounded-md px-3 py-2.5 text-sm font-semibold transition-all ${
                  isActive(item.path) ? 'bg-white text-primary-900 shadow-sm' : 'text-primary-100 hover:bg-primary-800 hover:text-white'
                }`}
              >
                <span className={`mr-3 flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-black ${
                  isActive(item.path) ? 'bg-primary-50 text-primary-700' : 'bg-white/10 text-primary-100'
                }`}>{item.icon}</span>
                {item.label}
              </Link>
            ) : null
          )}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
