import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  announcementAPI,
  attendanceAPI,
  crmAPI,
  dashboardAPI,
  employeeAPI,
  helpdeskAPI,
  leaveAPI,
  notificationAPI,
  payslipAPI,
  projectTrackerAPI,
} from '../services/api';
import { useNotification } from '../hooks/useNotification';
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS, hasPermission } from '../auth/authorization';
import {
  ActivityTimeline,
  EmptyState,
  LoadingSkeleton,
  ModuleBannerCard,
  ProfileWidget,
  QuickActionButton,
  SocialFeedCard,
  StatsStoryCards,
  StatusBadge,
} from '../components/social/SocialComponents';

const feedFilters = ['All', 'HR', 'Projects', 'CRM', 'Finance', 'Helpdesk'];

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [issues, setIssues] = useState([]);
  const [projects, setProjects] = useState([]);
  const [leads, setLeads] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [visibleCount, setVisibleCount] = useState(8);
  const [loading, setLoading] = useState(true);
  const { showError } = useNotification();
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, [user?.id, user?.role]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const canViewEmployees = hasPermission(user, [PERMISSIONS.EMPLOYEE_VIEW_ALL, PERMISSIONS.EMPLOYEE_VIEW_SELF]);
      const canProject = hasPermission(user, [PERMISSIONS.PROJECT_MANAGE, PERMISSIONS.PROJECT_CREATE, PERMISSIONS.PROJECT_UPDATE, PERMISSIONS.ISSUE_UPDATE]);
      const canCrm = hasPermission(user, [PERMISSIONS.CRM_VIEW, PERMISSIONS.CRM_MANAGE]);
      const canPayroll = hasPermission(user, [PERMISSIONS.PAYROLL_VIEW, PERMISSIONS.PAYROLL_MANAGE, PERMISSIONS.PAYSLIP_GENERATE]);

      const requests = await Promise.allSettled([
        dashboardAPI.getStats(),
        user?.id ? employeeAPI.getByUserId(user.id) : Promise.resolve({ data: { data: null } }),
        canViewEmployees ? employeeAPI.getAll() : Promise.resolve({ data: { data: [] } }),
        announcementAPI.getAll(),
        attendanceAPI.myHistory(),
        hasPermission(user, [PERMISSIONS.LEAVE_APPROVE]) ? leaveAPI.getPending() : Promise.resolve({ data: { data: [] } }),
        canProject ? projectTrackerAPI.getIssues() : Promise.resolve({ data: { data: [] } }),
        canProject ? projectTrackerAPI.getProjects() : Promise.resolve({ data: { data: [] } }),
        canCrm ? crmAPI.getLeads() : Promise.resolve({ data: { data: [] } }),
        canPayroll ? payslipAPI.getAll() : Promise.resolve({ data: { data: [] } }),
        helpdeskAPI.getTickets(),
        notificationAPI.getAll(),
      ]);

      const data = requests.map((result) => result.status === 'fulfilled' ? result.value.data.data : null);
      setStats(data[0]);
      setEmployee(data[1]);
      setEmployees(data[2] || []);
      setAnnouncements(data[3] || []);
      setAttendance(data[4] || []);
      setLeaves(data[5] || []);
      setIssues(data[6] || []);
      setProjects(data[7] || []);
      setLeads(data[8] || []);
      setPayslips(data[9] || []);
      setTickets(data[10]?.tickets || []);
      setNotifications(data[11] || []);
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const feedItems = useMemo(() => buildFeed({
    announcements,
    employees,
    attendance,
    leaves,
    issues,
    projects,
    leads,
    payslips,
    tickets,
    notifications,
  }), [announcements, employees, attendance, leaves, issues, projects, leads, payslips, tickets, notifications]);

  const filteredFeed = feedItems
    .filter((item) => filter === 'All' || item.module === filter)
    .filter((item) => `${item.title} ${item.description} ${item.actor}`.toLowerCase().includes(query.toLowerCase()));

  const stories = [
    { label: 'Employees', value: stats?.totalEmployees || employees.length || 0, icon: 'EM', to: '/employees', tone: 'bg-primary-700' },
    { label: 'Present', value: stats?.presentToday || 0, icon: 'IN', to: '/attendance', tone: 'bg-emerald-600' },
    { label: 'Leaves', value: stats?.pendingLeaveRequests || leaves.length || 0, icon: 'LV', to: '/leave', tone: 'bg-amber-500' },
    { label: 'Issues', value: issues.filter((issue) => issue.status !== 'DONE').length, icon: 'TK', to: '/projects/issues', tone: 'bg-cyan-600' },
    { label: 'Leads', value: leads.length, icon: 'LD', to: '/crm/leads', tone: 'bg-rose-500' },
  ];

  const quickActions = [
    { label: 'Apply leave', to: '/leave' },
    { label: 'Check attendance', to: '/attendance' },
    { label: 'Create issue', to: '/projects/issues' },
    { label: 'New lead', to: '/crm/leads' },
    { label: 'Compose mail', to: '/mail/compose' },
    { label: 'Helpdesk ticket', to: '/helpdesk' },
  ];

  const spotlight = employees.find((item) => item.isActive) || employee;
  const todayAttendance = attendance.find((item) => item.attendanceDate === new Date().toISOString().slice(0, 10));

  if (loading) {
    return (
      <div className="social-dashboard-shell">
        <div className="social-center"><LoadingSkeleton count={5} /></div>
      </div>
    );
  }

  return (
    <div className="social-dashboard-shell">
      <section className="social-center">
        <div className="welcome-post">
          <div>
            <p className="section-eyebrow text-white/75">Company Feed</p>
            <h1 className="mt-3 text-3xl font-black text-white md:text-4xl">Good to see you, {displayName(employee, user)}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80">
              Your live enterprise feed blends HR, CRM, projects, finance, mail, and support activity into one role-aware workspace.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="btn bg-white text-primary-800 hover:-translate-y-0.5 hover:bg-primary-50" to="/profile">View Profile</Link>
            <Link className="btn border border-white/30 bg-white/10 text-white hover:bg-white/20" to="/notifications">Notifications</Link>
          </div>
        </div>

        <StatsStoryCards items={stories} />

        <div className="feed-toolbar">
          <input
            className="input-field"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search the company feed..."
          />
          <div className="flex gap-2 overflow-x-auto">
            {feedFilters.map((item) => (
              <button
                key={item}
                type="button"
                className={`feed-filter ${filter === item ? 'feed-filter-active' : ''}`}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {filteredFeed.length === 0 ? (
          <EmptyState
            title="No feed updates found"
            message="Try another filter or search term. As teams work, new updates will appear here automatically."
            action={<button type="button" className="btn btn-secondary" onClick={() => { setQuery(''); setFilter('All'); }}>Reset feed</button>}
          />
        ) : (
          <div className="space-y-5">
            {filteredFeed.slice(0, visibleCount).map((item) => <SocialFeedCard key={`${item.type}-${item.id}`} item={item} />)}
            {visibleCount < filteredFeed.length && (
              <button type="button" className="btn btn-secondary mx-auto flex" onClick={() => setVisibleCount((count) => count + 6)}>
                Load More
              </button>
            )}
          </div>
        )}
      </section>

      <aside className="social-right-rail">
        <ProfileWidget user={user} employee={employee} />

        <div className="social-widget">
          <h2 className="text-lg font-black text-slate-950">Today</h2>
          <div className="mt-4 grid gap-3">
            <WidgetRow label="Attendance" value={todayAttendance?.status || 'Not marked'} to="/attendance" />
            <WidgetRow label="Pending approvals" value={leaves.length} to="/leave" />
            <WidgetRow label="Tasks due soon" value={issues.filter((issue) => issue.dueDate).length} to="/projects/issues" />
            <WidgetRow label="CRM follow-ups" value={leads.filter((lead) => lead.nextFollowUpAt).length} to="/crm/follow-ups" />
            <WidgetRow label="Helpdesk open" value={tickets.filter((ticket) => ticket.status !== 'RESOLVED').length} to="/helpdesk" />
          </div>
        </div>

        <ModuleBannerCard
          eyebrow="Spotlight"
          title={spotlight ? `${spotlight.firstName} ${spotlight.lastName}` : 'Employee Spotlight'}
          description={spotlight?.designation || 'Recognize people, milestones, and team movement right from the dashboard.'}
          to={spotlight?.id ? `/employees/${spotlight.id}` : '/employees'}
          actionLabel="View profile"
          tone="from-emerald-600 to-cyan-700"
        />

        <div className="social-widget">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-950">Trending Updates</h2>
            <StatusBadge value={`${notifications.filter((item) => !item.readFlag).length} unread`} />
          </div>
          <ActivityTimeline items={feedItems.slice(0, 6)} />
        </div>
      </aside>

      <QuickActionButton actions={quickActions} />
    </div>
  );
};

const WidgetRow = ({ label, value, to }) => (
  <Link to={to} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 transition hover:border-primary-200 hover:bg-primary-50">
    <span className="text-sm font-bold text-slate-700">{label}</span>
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{String(value).replaceAll('_', ' ')}</span>
  </Link>
);

const buildFeed = ({ announcements, employees, attendance, leaves, issues, projects, leads, payslips, tickets, notifications }) => {
  const items = [];

  announcements.slice(0, 8).forEach((item) => items.push({
    id: item.id,
    type: 'announcement',
    module: 'HR',
    tone: 'primary',
    title: item.title || 'Company announcement',
    description: item.content || item.message || 'A new announcement was posted.',
    actor: item.createdBy || 'Leadership',
    timestamp: item.createdAt,
    to: '/announcements',
    meta: ['Announcement'],
  }));

  employees.slice(0, 6).forEach((item) => items.push({
    id: item.id,
    type: 'employee',
    module: 'HR',
    tone: 'green',
    title: `${item.firstName} ${item.lastName} joined the workspace`,
    description: `${item.designation || 'Team member'} in ${item.departmentName || 'Tanvox'} is now part of the active directory.`,
    actor: `${item.firstName} ${item.lastName}`,
    timestamp: item.joiningDate || item.createdAt,
    to: `/employees/${item.id}`,
    meta: [item.employeeCode || 'Employee', item.departmentName || 'People'],
  }));

  attendance.slice(0, 6).forEach((item) => items.push({
    id: item.id,
    type: 'attendance',
    module: 'HR',
    tone: item.status === 'REJECTED' ? 'rose' : 'amber',
    title: `Attendance ${String(item.status || 'updated').replaceAll('_', ' ').toLowerCase()}`,
    description: `${item.employeeName || 'Employee'} attendance for ${item.attendanceDate || 'today'} is ${String(item.status || 'updated').replaceAll('_', ' ')}.`,
    actor: item.employeeName || 'Attendance',
    timestamp: item.createdAt || item.attendanceDate,
    to: '/attendance',
    meta: [item.checkInTime ? 'Checked in' : 'No check-in', item.checkOutTime ? 'Checked out' : 'No check-out'],
  }));

  leaves.slice(0, 6).forEach((item) => items.push({
    id: item.id,
    type: 'leave',
    module: 'HR',
    tone: 'amber',
    title: `${item.employeeName || 'Employee'} requested leave`,
    description: `${item.leaveType || 'Leave'} from ${item.fromDate || '-'} to ${item.toDate || '-'} needs attention.`,
    actor: item.employeeName || 'Leave desk',
    timestamp: item.createdAt || item.fromDate,
    to: '/leave',
    meta: [`${item.numberOfDays || 0} days`, item.status || 'Pending'],
  }));

  issues.slice(0, 8).forEach((item) => items.push({
    id: item.id,
    type: 'issue',
    module: 'Projects',
    tone: 'Project',
    title: `${item.issueKey || 'Task'}: ${item.title}`,
    description: `${item.projectName || 'Project'} moved through ${String(item.status || 'TODO').replaceAll('_', ' ')} with ${item.assigneeName || 'no assignee'} assigned.`,
    actor: item.assigneeName || item.reporterName || 'Project team',
    timestamp: item.updatedAt || item.createdAt,
    to: `/projects/issues/${item.id}`,
    priority: item.priority,
    meta: [item.issueType || 'Task', item.projectKey || 'Project'],
  }));

  projects.slice(0, 5).forEach((item) => items.push({
    id: item.id,
    type: 'project',
    module: 'Projects',
    tone: 'Project',
    title: `${item.name} project update`,
    description: `${item.projectKey || 'Project'} is ${String(item.status || 'ACTIVE').replaceAll('_', ' ')} under ${item.leadName || 'the project team'}.`,
    actor: item.leadName || 'Project office',
    timestamp: item.createdAt,
    to: `/projects/${item.id}`,
    priority: item.priority,
    meta: [item.projectKey || 'Project', item.status || 'Active'],
  }));

  leads.slice(0, 8).forEach((item) => items.push({
    id: item.id,
    type: 'lead',
    module: 'CRM',
    tone: 'CRM',
    title: `${item.name || 'Lead'} is in ${String(item.status || 'NEW').replaceAll('_', ' ')}`,
    description: `${item.company || 'Prospect'} is owned by ${item.assignedToName || 'CRM team'} with SLA ${item.slaStatus || 'ON_TIME'}.`,
    actor: item.assignedToName || 'CRM team',
    timestamp: item.updatedAt || item.createdAt || item.nextFollowUpAt,
    to: '/crm/leads',
    meta: [item.company || 'Lead', item.slaStatus || 'ON_TIME'],
  }));

  payslips.slice(0, 5).forEach((item) => items.push({
    id: item.id,
    type: 'payslip',
    module: 'Finance',
    tone: 'green',
    title: `Payslip issued for ${item.employeeName || 'employee'}`,
    description: `Payroll document for ${item.month || '-'} / ${item.year || '-'} is available for review.`,
    actor: 'Finance',
    timestamp: item.issuedDate,
    to: '/payslips',
    meta: ['Payroll', 'Payslip'],
  }));

  tickets.slice(0, 7).forEach((item) => items.push({
    id: item.id || item.ticketNumber,
    type: 'ticket',
    module: 'Helpdesk',
    tone: item.status === 'RESOLVED' ? 'green' : 'amber',
    title: `${item.ticketNumber || 'Ticket'}: ${item.title}`,
    description: `${item.employeeName || 'Employee'} has a ${String(item.status || 'OPEN').replaceAll('_', ' ').toLowerCase()} ${item.category || 'support'} request.`,
    actor: item.employeeName || 'Helpdesk',
    timestamp: item.updatedAt || item.createdAt,
    to: '/helpdesk',
    meta: [item.category || 'General', item.status || 'Open'],
  }));

  notifications.slice(0, 8).forEach((item) => items.push({
    id: item.id,
    type: 'notification',
    module: 'All',
    tone: item.readFlag ? 'slate' : 'primary',
    title: item.title || 'Notification',
    description: item.message || 'You have a new workspace update.',
    actor: 'Notification center',
    timestamp: item.createdAt,
    to: item.link || '/notifications',
    meta: [item.readFlag ? 'Read' : 'Unread'],
  }));

  return items.sort((left, right) => new Date(right.timestamp || 0) - new Date(left.timestamp || 0));
};

const displayName = (employee, user) => {
  if (employee?.firstName) return employee.firstName;
  return String(user?.email || 'there').split('@')[0];
};

export default DashboardPage;
