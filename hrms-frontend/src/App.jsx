import React from 'react';
import { useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './auth/ProtectedRoute';
import { PERMISSIONS } from './auth/authorization';
import LoginPage from './pages/LoginPage';
import DashboardPage from './features/dashboard';
import EmployeePage from './features/employees';
import AttendancePage from './features/attendance';
import AttendanceApprovalsPage from './pages/AttendanceApprovalsPage';
import {
  AttendanceCalendarPage,
  AttendanceHistoryPage,
  AttendanceRegularizationPage,
  AttendanceShiftsPage,
  AttendanceHolidaysPage,
  AttendanceReportsPage,
} from './pages/AttendanceEnterprisePages';
import LeavePage from './features/leave';
import PayslipPage from './features/payroll';
import AnnouncementPage from './pages/AnnouncementPage';
import HelpdeskPage from './pages/HelpdeskPage';
import DocumentPage from './pages/DocumentPage';
import ProjectTrackerPage from './features/project-tracker';
import InternalMailPage from './features/internal-mail';
import ApprovalQueuePage from './pages/ApprovalQueuePage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import CrmPage from './pages/CrmPage';
import UserAdminPage from './pages/UserAdminPage';
import Sidebar from './layout/Sidebar';
import Navbar from './layout/Navbar';
import UnauthorizedPage from './shared/UnauthorizedPage';
import ErrorBoundary from './shared/ErrorBoundary';
import { ADMIN_ROLES, CRM_ROLES, FINANCE_ROLES, PEOPLE_HR_ROLES, PROJECT_ROLES } from './navigation/sidebarMenu';
import {
  AuditLogsPage,
  FinancePage,
  InternsPage,
  NotificationsPage,
  ProfilePage,
  RolesPermissionsPage,
  SystemSettingsPage,
} from './pages/OperationalPages';

export default function App() {
  const { user } = useAuth();
  const isPublic = !user;

  return (
    <>
      <Toaster position="top-right" />
      <Router>
        {!isPublic && <Navbar />}
        <div className={isPublic ? '' : 'flex'}>
          {!isPublic && <Sidebar />}
          <main className={isPublic ? 'w-full' : 'flex-1'}>
            <ErrorBoundary>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route path="/change-password" element={
                <ProtectedRoute>
                  <ChangePasswordPage />
                </ProtectedRoute>
              } />
              
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } />

              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />

              <Route path="/notifications" element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              } />
              
              <Route path="/employees" element={
                <ProtectedRoute permissions={[PERMISSIONS.EMPLOYEE_VIEW_ALL]}>
                  <EmployeePage />
                </ProtectedRoute>
              } />

              <Route path="/employees/:id" element={
                <ProtectedRoute permissions={[PERMISSIONS.EMPLOYEE_VIEW_ALL]}>
                  <EmployeePage />
                </ProtectedRoute>
              } />

              <Route path="/employees/add" element={
                <ProtectedRoute roles={['SUPER_ADMIN']} permissions={[PERMISSIONS.USER_CREATE]}>
                  <UserAdminPage />
                </ProtectedRoute>
              } />

              <Route path="/employees/new" element={<Navigate to="/employees/add" replace />} />

              <Route path="/interns" element={
                <ProtectedRoute roles={PEOPLE_HR_ROLES} permissions={[PERMISSIONS.INTERN_CREATE, PERMISSIONS.EMPLOYEE_VIEW_ALL]}>
                  <InternsPage />
                </ProtectedRoute>
              } />

              <Route path="/admin/users" element={
                <ProtectedRoute roles={['SUPER_ADMIN']} permissions={[PERMISSIONS.USER_VIEW, PERMISSIONS.USER_CREATE, PERMISSIONS.USER_UPDATE]}>
                  <UserAdminPage />
                </ProtectedRoute>
              } />
              
              <Route path="/attendance" element={
                <ProtectedRoute permissions={[PERMISSIONS.ATTENDANCE_VIEW, PERMISSIONS.ATTENDANCE_MANAGE]}>
                  <AttendancePage />
                </ProtectedRoute>
              } />

              <Route path="/attendance-approvals" element={
                <ProtectedRoute permissions={[PERMISSIONS.ATTENDANCE_APPROVE, PERMISSIONS.ATTENDANCE_MANAGE]}>
                  <AttendanceApprovalsPage />
                </ProtectedRoute>
              } />

              <Route path="/attendance/calendar" element={
                <ProtectedRoute permissions={[PERMISSIONS.ATTENDANCE_VIEW, PERMISSIONS.ATTENDANCE_MANAGE]}>
                  <AttendanceCalendarPage />
                </ProtectedRoute>
              } />

              <Route path="/attendance/history" element={
                <ProtectedRoute permissions={[PERMISSIONS.ATTENDANCE_VIEW, PERMISSIONS.ATTENDANCE_MANAGE]}>
                  <AttendanceHistoryPage />
                </ProtectedRoute>
              } />

              <Route path="/attendance/approvals" element={
                <ProtectedRoute permissions={[PERMISSIONS.ATTENDANCE_APPROVE, PERMISSIONS.ATTENDANCE_MANAGE]}>
                  <AttendanceApprovalsPage />
                </ProtectedRoute>
              } />

              <Route path="/attendance/regularization" element={
                <ProtectedRoute permissions={[PERMISSIONS.ATTENDANCE_VIEW, PERMISSIONS.ATTENDANCE_MANAGE]}>
                  <AttendanceRegularizationPage />
                </ProtectedRoute>
              } />

              <Route path="/attendance/shifts" element={
                <ProtectedRoute permissions={[PERMISSIONS.SHIFT_CREATE, PERMISSIONS.SHIFT_ASSIGN, PERMISSIONS.ATTENDANCE_MANAGE]}>
                  <AttendanceShiftsPage />
                </ProtectedRoute>
              } />

              <Route path="/attendance/holidays" element={
                <ProtectedRoute permissions={[PERMISSIONS.ATTENDANCE_VIEW, PERMISSIONS.ATTENDANCE_MANAGE, PERMISSIONS.HOLIDAY_CREATE, PERMISSIONS.HOLIDAY_UPDATE]}>
                  <AttendanceHolidaysPage />
                </ProtectedRoute>
              } />

              <Route path="/attendance/reports" element={
                <ProtectedRoute permissions={[PERMISSIONS.REPORT_VIEW, PERMISSIONS.ATTENDANCE_MANAGE, PERMISSIONS.ATTENDANCE_APPROVE]}>
                  <AttendanceReportsPage />
                </ProtectedRoute>
              } />
              
              <Route path="/leave" element={
                <ProtectedRoute permissions={[PERMISSIONS.LEAVE_APPLY, PERMISSIONS.LEAVE_APPROVE]}>
                  <LeavePage />
                </ProtectedRoute>
              } />
              
              <Route path="/payslips" element={
                <ProtectedRoute permissions={[PERMISSIONS.PAYROLL_VIEW, PERMISSIONS.PAYROLL_MANAGE, PERMISSIONS.PAYSLIP_GENERATE]}>
                  <PayslipPage />
                </ProtectedRoute>
              } />
              
              <Route path="/announcements" element={
                <ProtectedRoute>
                  <AnnouncementPage />
                </ProtectedRoute>
              } />
              
              <Route path="/helpdesk" element={
                <ProtectedRoute>
                  <HelpdeskPage />
                </ProtectedRoute>
              } />
              
              <Route path="/documents" element={
                <ProtectedRoute>
                  <DocumentPage />
                </ProtectedRoute>
              } />

              <Route path="/mail" element={
                <ProtectedRoute>
                  <Navigate to="/mail/inbox" replace />
                </ProtectedRoute>
              } />

              <Route path="/mail/inbox" element={
                <ProtectedRoute permissions={[PERMISSIONS.INTERNAL_MAIL_VIEW]}>
                  <InternalMailPage view="inbox" />
                </ProtectedRoute>
              } />

              <Route path="/mail/sent" element={
                <ProtectedRoute permissions={[PERMISSIONS.INTERNAL_MAIL_VIEW]}>
                  <InternalMailPage view="sent" />
                </ProtectedRoute>
              } />

              <Route path="/mail/drafts" element={
                <ProtectedRoute permissions={[PERMISSIONS.INTERNAL_MAIL_VIEW]}>
                  <InternalMailPage view="drafts" />
                </ProtectedRoute>
              } />

              <Route path="/mail/trash" element={
                <ProtectedRoute permissions={[PERMISSIONS.INTERNAL_MAIL_VIEW]}>
                  <InternalMailPage view="trash" />
                </ProtectedRoute>
              } />

              <Route path="/mail/starred" element={
                <ProtectedRoute permissions={[PERMISSIONS.INTERNAL_MAIL_VIEW]}>
                  <InternalMailPage view="starred" />
                </ProtectedRoute>
              } />

              <Route path="/mail/compose" element={
                <ProtectedRoute permissions={[PERMISSIONS.INTERNAL_MAIL_SEND]}>
                  <InternalMailPage view="compose" />
                </ProtectedRoute>
              } />

              <Route path="/mail/message/:id" element={
                <ProtectedRoute permissions={[PERMISSIONS.INTERNAL_MAIL_VIEW]}>
                  <InternalMailPage view="message" />
                </ProtectedRoute>
              } />

              <Route path="/approvals" element={
                <ProtectedRoute>
                  <ApprovalQueuePage />
                </ProtectedRoute>
              } />

              <Route path="/crm" element={
                <ProtectedRoute roles={CRM_ROLES} permissions={[PERMISSIONS.CRM_VIEW, PERMISSIONS.CRM_MANAGE, PERMISSIONS.CRM_APPROVE]}>
                  <CrmPage view="dashboard" />
                </ProtectedRoute>
              } />

              <Route path="/crm/leads" element={<ProtectedRoute roles={CRM_ROLES} permissions={[PERMISSIONS.CRM_VIEW, PERMISSIONS.CRM_MANAGE]}><CrmPage view="leads" /></ProtectedRoute>} />
              <Route path="/crm/clients" element={<ProtectedRoute roles={CRM_ROLES} permissions={[PERMISSIONS.CRM_VIEW, PERMISSIONS.CRM_MANAGE]}><CrmPage view="clients" /></ProtectedRoute>} />
              <Route path="/crm/deals" element={<ProtectedRoute roles={CRM_ROLES} permissions={[PERMISSIONS.CRM_VIEW, PERMISSIONS.CRM_MANAGE]}><CrmPage view="deals" /></ProtectedRoute>} />
              <Route path="/crm/follow-ups" element={<ProtectedRoute roles={CRM_ROLES} permissions={[PERMISSIONS.CRM_VIEW, PERMISSIONS.CRM_MANAGE]}><CrmPage view="followups" /></ProtectedRoute>} />
              <Route path="/crm/proposals" element={<ProtectedRoute roles={CRM_ROLES} permissions={[PERMISSIONS.CRM_VIEW, PERMISSIONS.CRM_MANAGE, PERMISSIONS.CRM_APPROVE]}><CrmPage view="proposals" /></ProtectedRoute>} />
              <Route path="/crm/sla-tracking" element={<ProtectedRoute roles={CRM_ROLES} permissions={[PERMISSIONS.CRM_VIEW, PERMISSIONS.CRM_MANAGE, PERMISSIONS.CRM_APPROVE]}><CrmPage view="sla" /></ProtectedRoute>} />
              <Route path="/crm/reports" element={<ProtectedRoute roles={CRM_ROLES} permissions={[PERMISSIONS.CRM_VIEW, PERMISSIONS.CRM_MANAGE, PERMISSIONS.CRM_APPROVE, PERMISSIONS.REPORT_VIEW]}><CrmPage view="reports" /></ProtectedRoute>} />

              <Route path="/finance/payroll" element={<ProtectedRoute roles={FINANCE_ROLES} permissions={[PERMISSIONS.PAYROLL_VIEW, PERMISSIONS.PAYROLL_MANAGE]}><FinancePage view="payroll" /></ProtectedRoute>} />
              <Route path="/finance/salary-structure" element={<ProtectedRoute roles={FINANCE_ROLES} permissions={[PERMISSIONS.PAYROLL_VIEW, PERMISSIONS.PAYROLL_MANAGE]}><FinancePage view="salary" /></ProtectedRoute>} />
              <Route path="/finance/generate-payslip" element={<ProtectedRoute roles={FINANCE_ROLES} permissions={[PERMISSIONS.PAYSLIP_GENERATE, PERMISSIONS.PAYROLL_MANAGE]}><FinancePage view="generate" /></ProtectedRoute>} />
              <Route path="/finance/reports" element={<ProtectedRoute roles={FINANCE_ROLES} permissions={[PERMISSIONS.PAYROLL_VIEW, PERMISSIONS.PAYROLL_MANAGE, PERMISSIONS.REPORT_VIEW]}><FinancePage view="reports" /></ProtectedRoute>} />

              <Route path="/project-tracker" element={
                <ProtectedRoute>
                  <Navigate to="/projects/dashboard" replace />
                </ProtectedRoute>
              } />

              <Route path="/projects/dashboard" element={
                <ProtectedRoute roles={PROJECT_ROLES} permissions={[PERMISSIONS.PROJECT_MANAGE, PERMISSIONS.PROJECT_CREATE, PERMISSIONS.PROJECT_UPDATE, PERMISSIONS.ISSUE_UPDATE]}>
                  <ProjectTrackerPage view="dashboard" />
                </ProtectedRoute>
              } />

              <Route path="/projects" element={
                <ProtectedRoute roles={PROJECT_ROLES} permissions={[PERMISSIONS.PROJECT_MANAGE, PERMISSIONS.PROJECT_CREATE, PERMISSIONS.PROJECT_UPDATE]}>
                  <ProjectTrackerPage view="projects" />
                </ProtectedRoute>
              } />

              <Route path="/projects/create" element={
                <ProtectedRoute roles={PROJECT_ROLES} permissions={[PERMISSIONS.PROJECT_CREATE, PERMISSIONS.PROJECT_MANAGE]}>
                  <ProjectTrackerPage view="projects" startCreateProject />
                </ProtectedRoute>
              } />

              <Route path="/projects/:id" element={
                <ProtectedRoute roles={PROJECT_ROLES} permissions={[PERMISSIONS.PROJECT_MANAGE, PERMISSIONS.PROJECT_CREATE, PERMISSIONS.PROJECT_UPDATE]}>
                  <ProjectTrackerPage view="project-detail" />
                </ProtectedRoute>
              } />

              <Route path="/projects/board" element={<ProtectedRoute roles={PROJECT_ROLES} permissions={[PERMISSIONS.PROJECT_MANAGE, PERMISSIONS.ISSUE_UPDATE]}><ProjectTrackerPage view="board" /></ProtectedRoute>} />
              <Route path="/projects/backlog" element={<ProtectedRoute roles={PROJECT_ROLES} permissions={[PERMISSIONS.PROJECT_MANAGE, PERMISSIONS.ISSUE_UPDATE]}><ProjectTrackerPage view="backlog" /></ProtectedRoute>} />
              <Route path="/projects/sprints" element={<ProtectedRoute roles={PROJECT_ROLES} permissions={[PERMISSIONS.PROJECT_MANAGE, PERMISSIONS.SPRINT_CREATE, PERMISSIONS.SPRINT_UPDATE]}><ProjectTrackerPage view="sprints" /></ProtectedRoute>} />
              <Route path="/projects/issues" element={<ProtectedRoute roles={PROJECT_ROLES} permissions={[PERMISSIONS.ISSUE_CREATE, PERMISSIONS.ISSUE_UPDATE]}><ProjectTrackerPage view="issues" /></ProtectedRoute>} />
              <Route path="/projects/issues/:id" element={<ProtectedRoute roles={PROJECT_ROLES} permissions={[PERMISSIONS.ISSUE_CREATE, PERMISSIONS.ISSUE_UPDATE]}><ProjectTrackerPage view="issue-detail" /></ProtectedRoute>} />
              <Route path="/projects/reports" element={<ProtectedRoute roles={PROJECT_ROLES} permissions={[PERMISSIONS.REPORT_VIEW]}><ProjectTrackerPage view="reports" /></ProtectedRoute>} />

              <Route path="/project-tracker/dashboard" element={
                <ProtectedRoute permissions={[PERMISSIONS.PROJECT_MANAGE, PERMISSIONS.PROJECT_CREATE, PERMISSIONS.PROJECT_UPDATE, PERMISSIONS.ISSUE_UPDATE]}>
                  <ProjectTrackerPage view="dashboard" />
                </ProtectedRoute>
              } />

              <Route path="/project-tracker/projects" element={
                <ProtectedRoute permissions={[PERMISSIONS.PROJECT_MANAGE, PERMISSIONS.PROJECT_CREATE, PERMISSIONS.PROJECT_UPDATE]}>
                  <ProjectTrackerPage view="projects" />
                </ProtectedRoute>
              } />

              <Route path="/project-tracker/projects/:id" element={
                <ProtectedRoute permissions={[PERMISSIONS.PROJECT_MANAGE, PERMISSIONS.PROJECT_CREATE, PERMISSIONS.PROJECT_UPDATE]}>
                  <ProjectTrackerPage view="project-detail" />
                </ProtectedRoute>
              } />

              <Route path="/project-tracker/create" element={
                <ProtectedRoute roles={PROJECT_ROLES} permissions={[PERMISSIONS.PROJECT_CREATE, PERMISSIONS.PROJECT_MANAGE]}>
                  <ProjectTrackerPage view="projects" startCreateProject />
                </ProtectedRoute>
              } />

              <Route path="/project-tracker/board" element={
                <ProtectedRoute permissions={[PERMISSIONS.PROJECT_MANAGE, PERMISSIONS.ISSUE_UPDATE]}>
                  <ProjectTrackerPage view="board" />
                </ProtectedRoute>
              } />

              <Route path="/project-tracker/backlog" element={
                <ProtectedRoute permissions={[PERMISSIONS.PROJECT_MANAGE, PERMISSIONS.ISSUE_UPDATE]}>
                  <ProjectTrackerPage view="backlog" />
                </ProtectedRoute>
              } />

              <Route path="/project-tracker/sprints" element={
                <ProtectedRoute permissions={[PERMISSIONS.PROJECT_MANAGE, PERMISSIONS.SPRINT_CREATE, PERMISSIONS.SPRINT_UPDATE]}>
                  <ProjectTrackerPage view="sprints" />
                </ProtectedRoute>
              } />

              <Route path="/project-tracker/issues" element={
                <ProtectedRoute permissions={[PERMISSIONS.ISSUE_CREATE, PERMISSIONS.ISSUE_UPDATE]}>
                  <ProjectTrackerPage view="issues" />
                </ProtectedRoute>
              } />

              <Route path="/project-tracker/issues/:id" element={
                <ProtectedRoute permissions={[PERMISSIONS.ISSUE_CREATE, PERMISSIONS.ISSUE_UPDATE]}>
                  <ProjectTrackerPage view="issue-detail" />
                </ProtectedRoute>
              } />

              <Route path="/project-tracker/reports" element={
                <ProtectedRoute permissions={[PERMISSIONS.REPORT_VIEW]}>
                  <ProjectTrackerPage view="reports" />
                </ProtectedRoute>
              } />

              <Route path="/admin/roles-permissions" element={<ProtectedRoute roles={ADMIN_ROLES} permissions={[PERMISSIONS.ROLE_ASSIGN, PERMISSIONS.SETTINGS_MANAGE]}><RolesPermissionsPage /></ProtectedRoute>} />
              <Route path="/admin/audit-logs" element={<ProtectedRoute roles={ADMIN_ROLES} permissions={[PERMISSIONS.AUDIT_VIEW]}><AuditLogsPage /></ProtectedRoute>} />
              <Route path="/admin/system-settings" element={<ProtectedRoute roles={ADMIN_ROLES} permissions={[PERMISSIONS.SETTINGS_MANAGE]}><SystemSettingsPage /></ProtectedRoute>} />

              <Route path="/unauthorized" element={
                <ProtectedRoute>
                  <UnauthorizedPage />
                </ProtectedRoute>
              } />
              
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            </ErrorBoundary>
          </main>
        </div>
      </Router>
    </>
  );
}
