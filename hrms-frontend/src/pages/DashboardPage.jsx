import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  API_BASE_URL,
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
import { PERMISSIONS, hasPermission, hasRole } from '../auth/authorization';
import { CRM_ROLES, FINANCE_ROLES, PROJECT_ROLES } from '../navigation/sidebarMenu';
import {
  ActivityTimeline,
  EmptyState,
  LoadingSkeleton,
  ModuleBannerCard,
  ProfileWidget,
  QuickActionButton,
  SocialFeedCard,
  StatusBadge,
} from '../components/social/SocialComponents';

const feedFilters = ['All', 'HR', 'Projects', 'CRM', 'Finance', 'Helpdesk'];
const todayIso = () => new Date().toISOString().slice(0, 10);

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [attendanceToday, setAttendanceToday] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [issues, setIssues] = useState([]);
  const [projects, setProjects] = useState([]);
  const [leads, setLeads] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loadErrors, setLoadErrors] = useState({});
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [visibleCount, setVisibleCount] = useState(8);
  const [loading, setLoading] = useState(true);
  const { showError } = useNotification();
  const { user } = useAuth();
  const access = useMemo(() => getDashboardAccess(user), [user]);

  useEffect(() => {
    if (!user) return;
    fetchDashboardData();
  }, [user?.id, user?.role]);

  const fetchDashboardData = async () => {
    const errors = {};

    const runDashboardRequest = async (key, requestFactory, fallback = null) => {
      console.info('[dashboard] API request', {
        key,
        apiBase: API_BASE_URL,
        tokenExists: Boolean(localStorage.getItem('token')),
      });

      try {
        const response = await requestFactory();
        const payload = unwrapApiPayload(response);
        console.info('[dashboard] API response', { key, payload });
        return payload ?? fallback;
      } catch (error) {
        const message = error.userMessage || error.response?.data?.message || error.message || 'Request failed';
        errors[key] = {
          message,
          status: error.response?.status,
        };
        console.error('[dashboard] API error', {
          key,
          apiBase: API_BASE_URL,
          status: error.response?.status,
          message,
        });
        return fallback;
      }
    };

    try {
      setLoading(true);
      setLoadErrors({});
      setVisibleCount(8);

      const profilePayload = user?.id
        ? await runDashboardRequest('profile', () => employeeAPI.getByUserId(user.id))
        : null;
      const profile = normalizeEntity(profilePayload);
      setEmployee(profile);

      const resultEntries = await Promise.all([
        ['stats', runDashboardRequest('stats', dashboardAPI.getStats)],
        ['employees', access.canViewEmployees
          ? runDashboardRequest('employees', employeeAPI.getAll, [])
          : Promise.resolve([])],
        ['announcements', runDashboardRequest('announcements', announcementAPI.getAll, [])],
        ['attendanceToday', runDashboardRequest('attendanceToday', attendanceAPI.today)],
        ['attendanceHistory', runDashboardRequest('attendanceHistory', attendanceAPI.myHistory, [])],
        ['leaves', access.canApproveLeave
          ? runDashboardRequest('pendingLeaves', leaveAPI.getPending, [])
          : profile?.id
            ? runDashboardRequest('employeeLeaves', () => leaveAPI.getByEmployee(profile.id), [])
            : Promise.resolve([])],
        ['issues', access.canProject ? runDashboardRequest('issues', projectTrackerAPI.getIssues, []) : Promise.resolve([])],
        ['projects', access.canProject ? runDashboardRequest('projects', projectTrackerAPI.getProjects, []) : Promise.resolve([])],
        ['leads', access.canCrm ? runDashboardRequest('crmLeads', crmAPI.getLeads, []) : Promise.resolve([])],
        ['payslips', access.canPayroll
          ? runDashboardRequest('payslips', payslipAPI.getAll, [])
          : profile?.id
            ? runDashboardRequest('employeePayslips', () => payslipAPI.getByEmployee(profile.id), [])
            : Promise.resolve([])],
        ['tickets', runDashboardRequest('helpdeskTickets', helpdeskAPI.getTickets, [])],
        ['notifications', runDashboardRequest('notifications', notificationAPI.getAll, [])],
      ].map(async ([key, promise]) => [key, await promise]));
      const results = Object.fromEntries(resultEntries);

      setStats(normalizeEntity(results.stats));
      setEmployees(toArray(results.employees));
      setAnnouncements(toArray(results.announcements));
      setAttendanceToday(normalizeEntity(results.attendanceToday));
      setAttendance(toArray(results.attendanceHistory));
      setLeaves(toArray(results.leaves));
      setIssues(toArray(results.issues));
      setProjects(toArray(results.projects));
      setLeads(toArray(results.leads));
      setPayslips(toArray(results.payslips));
      setTickets(toArray(results.tickets));
      setNotifications(toArray(results.notifications));
      setLoadErrors(errors);

      if (Object.keys(errors).length > 0) {
        showError('Some dashboard widgets could not load. Working sections are still shown.');
      }
    } catch (error) {
      showError(error.userMessage || error.response?.data?.message || 'Failed to load dashboard');
      setLoadErrors({ dashboard: { message: error.message || 'Failed to load dashboard' } });
    } finally {
      setLoading(false);
    }
  };

  const dashboardMetrics = useMemo(() => buildMetrics({
    stats,
    employees,
    attendanceToday,
    attendance,
    leaves,
    issues,
    projects,
    leads,
    payslips,
    tickets,
    notifications,
    errors: loadErrors,
    access,
  }), [stats, employees, attendanceToday, attendance, leaves, issues, projects, leads, payslips, tickets, notifications, loadErrors, access]);

  const feedItems = useMemo(() => buildFeed({
    announcements,
    employees,
    attendance: [attendanceToday, ...attendance].filter(Boolean),
    leaves,
    issues,
    projects,
    leads,
    payslips,
    tickets,
    notifications,
  }), [announcements, employees, attendanceToday, attendance, leaves, issues, projects, leads, payslips, tickets, notifications]);

  const filteredFeed = feedItems
    .filter((item) => filter === 'All' || item.module === filter)
    .filter((item) => `${item.title} ${item.description} ${item.actor}`.toLowerCase().includes(query.toLowerCase()));

  const quickActions = [
    { label: 'Apply leave', to: '/leave' },
    { label: 'Check attendance', to: '/attendance' },
    { label: 'Create issue', to: '/projects/issues' },
    { label: 'New lead', to: '/crm/leads' },
    { label: 'Compose mail', to: '/mail/compose' },
    { label: 'Helpdesk ticket', to: '/helpdesk' },
  ];

  const spotlight = employees.find((item) => item.isActive !== false) || employee;
  const openIssues = issues.filter((issue) => !['DONE', 'CLOSED', 'RESOLVED'].includes(String(issue.status || '').toUpperCase()));
  const openTickets = tickets.filter((ticket) => !['RESOLVED', 'CLOSED'].includes(String(ticket.status || '').toUpperCase()));
  const followUps = leads.filter((lead) => lead.nextFollowUpAt || lead.followUpDate || lead.slaStatus);
  const todaysAttendanceStatus = attendanceToday?.status
    || attendance.find((item) => item.attendanceDate === todayIso())?.status
    || (stats?.presentToday > 0 ? `${stats.presentToday} present` : 'Not marked');

  if (loading) {
    return (
      <div className="social-dashboard-shell">
        <div className="social-center">
          <div className="welcome-post h-52" />
          <LoadingSkeleton count={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="social-dashboard-shell">
      <section className="social-center">
        <div className="welcome-post">
          <div className="relative z-10">
            <p className="section-eyebrow text-white/75">Live Company Feed</p>
            <h1 className="mt-3 text-3xl font-black text-white md:text-4xl">
              Good to see you, {displayName(employee, user)}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80">
              Real HR, projects, CRM, finance, support, and notification activity in one role-aware dashboard.
            </p>
          </div>
          <div className="relative z-10 mt-6 flex flex-wrap gap-3">
            <Link className="btn bg-white text-primary-800 hover:-translate-y-0.5 hover:bg-primary-50" to="/profile">View Profile</Link>
            <Link className="btn border border-white/30 bg-white/10 text-white hover:bg-white/20" to="/notifications">Notifications</Link>
          </div>
        </div>

        <DashboardStatGrid items={dashboardMetrics} />

        {Object.keys(loadErrors).length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
            Some dashboard APIs returned errors. Open the browser console for temporary `[dashboard]` logs, or retry loading the dashboard.
            <button type="button" className="ml-3 font-black underline" onClick={fetchDashboardData}>Retry</button>
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-2">
          <DashboardPanel title="Pending Approvals" action="Review leaves" to="/leave">
            {leaves.length === 0 ? (
              <MiniEmpty text="No pending leave requests found." />
            ) : leaves.slice(0, 4).map((item) => (
              <CompactItem
                key={item.id}
                title={`${item.employeeName || 'Employee'} requested leave`}
                meta={`${item.leaveType || 'Leave'} - ${item.fromDate || '-'} to ${item.toDate || '-'}`}
                status={item.status || 'Pending'}
                to="/leave"
              />
            ))}
          </DashboardPanel>

          <DashboardPanel title="Projects In Motion" action="Open issues" to="/projects/issues">
            {openIssues.length === 0 ? (
              <MiniEmpty text="No open project issues found." />
            ) : openIssues.slice(0, 4).map((item) => (
              <CompactItem
                key={item.id}
                title={item.title || item.issueKey || 'Project issue'}
                meta={`${item.projectName || 'Project'} - ${item.assigneeName || 'Unassigned'}`}
                status={item.priority || item.status || 'Open'}
                to={item.id ? `/projects/issues/${item.id}` : '/projects/issues'}
              />
            ))}
          </DashboardPanel>
        </div>

        <div className="feed-toolbar">
          <input
            className="input-field"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search employees, projects, CRM, tickets, and notifications..."
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
            title="No activity yet"
            message="Create an announcement, add an employee, update a project, or log CRM activity to populate the company feed."
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
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-slate-950">Today</h2>
            <StatusBadge value={String(todaysAttendanceStatus).replaceAll('_', ' ')} tone="green" />
          </div>
          <div className="mt-4 grid gap-3">
            <WidgetRow label="Attendance" value={todaysAttendanceStatus} to="/attendance" />
            <WidgetRow label="Leave approvals" value={leaves.length} to="/leave" />
            <WidgetRow label="Tasks due soon" value={openIssues.length} to="/projects/issues" />
            <WidgetRow label="CRM reminders" value={followUps.length} to="/crm/follow-ups" />
            <WidgetRow label="Helpdesk open" value={openTickets.length} to="/helpdesk" />
          </div>
        </div>

        <ModuleBannerCard
          eyebrow="Employee Spotlight"
          title={spotlight ? `${spotlight.firstName || ''} ${spotlight.lastName || ''}`.trim() || spotlight.email || 'Team member' : 'Team spotlight'}
          description={spotlight?.designation || spotlight?.departmentName || 'People milestones and recognition appear here as employee data loads.'}
          to={spotlight?.id ? `/employees/${spotlight.id}` : '/employees'}
          actionLabel="View profile"
          tone="from-emerald-600 to-cyan-700"
        />

        <div className="social-widget">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-slate-950">Notifications</h2>
            <StatusBadge value={`${notifications.filter((item) => !item.readFlag).length} unread`} />
          </div>
          <div className="mt-4 space-y-3">
            {notifications.length === 0 ? <MiniEmpty text="No notifications found." /> : notifications.slice(0, 4).map((item) => (
              <CompactItem
                key={item.id}
                title={item.title || 'Notification'}
                meta={item.message || 'Workspace update'}
                status={item.readFlag ? 'Read' : 'Unread'}
                to={item.link || '/notifications'}
              />
            ))}
          </div>
        </div>

        <div className="social-widget">
          <h2 className="text-lg font-black text-slate-950">Recent Activity</h2>
          <ActivityTimeline items={feedItems.slice(0, 6)} />
        </div>
      </aside>

      <QuickActionButton actions={quickActions} />
    </div>
  );
};

const DashboardStatGrid = ({ items }) => (
  <div className="dashboard-stat-grid">
    {items.map((item) => (
      <Link key={item.label} to={item.to || '/dashboard'} className="dashboard-stat-card">
        <div className={`story-orb ${item.tone || 'bg-primary-700'}`}>{item.icon}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="truncate text-xs font-black uppercase tracking-wide text-slate-500">{item.label}</p>
            {item.error && <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-black uppercase text-red-700">API</span>}
          </div>
          <p className="mt-1 text-2xl font-black text-slate-950">{item.value}</p>
          <p className="mt-1 truncate text-xs font-bold text-slate-500">{item.caption}</p>
        </div>
      </Link>
    ))}
  </div>
);

const DashboardPanel = ({ title, action, to, children }) => (
  <section className="dashboard-panel">
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-lg font-black text-slate-950">{title}</h2>
      {to && <Link to={to} className="text-sm font-black text-primary-700 hover:text-primary-900">{action}</Link>}
    </div>
    <div className="space-y-3">{children}</div>
  </section>
);

const CompactItem = ({ title, meta, status, to }) => (
  <Link to={to || '/dashboard'} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 transition hover:border-primary-200 hover:bg-primary-50">
    <span className="min-w-0">
      <span className="block truncate text-sm font-black text-slate-900">{title}</span>
      <span className="mt-1 block truncate text-xs font-semibold text-slate-500">{meta}</span>
    </span>
    <StatusBadge value={status} />
  </Link>
);

const MiniEmpty = ({ text }) => (
  <div className="rounded-lg border border-dashed border-slate-250 bg-slate-50 px-4 py-5 text-sm font-semibold text-slate-500">
    {text}
  </div>
);

const WidgetRow = ({ label, value, to }) => (
  <Link to={to} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 transition hover:border-primary-200 hover:bg-primary-50">
    <span className="text-sm font-bold text-slate-700">{label}</span>
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{String(value ?? '-').replaceAll('_', ' ')}</span>
  </Link>
);

const buildMetrics = ({ stats, employees, attendanceToday, attendance, leaves, issues, projects, leads, payslips, tickets, notifications, errors, access }) => {
  const internCount = employees.filter(isIntern).length;
  const presentToday = Number(stats?.presentToday ?? 0) || countPresentToday(attendanceToday, attendance);
  const openIssues = issues.filter((issue) => !['DONE', 'CLOSED', 'RESOLVED'].includes(String(issue.status || '').toUpperCase())).length;
  const openTickets = tickets.filter((ticket) => !['RESOLVED', 'CLOSED'].includes(String(ticket.status || '').toUpperCase())).length;

  return [
    metric('Employees', stats?.totalEmployees ?? employees.length, access.canViewEmployees ? '/employees' : '/profile', 'EM', 'bg-primary-700', sourceError(errors, 'employees'), 'Active directory'),
    metric('Interns', internCount, access.canViewEmployees ? '/interns' : '/profile', 'IN', 'bg-cyan-600', sourceError(errors, 'employees'), 'Current interns'),
    metric('Attendance Today', presentToday, '/attendance', 'AT', 'bg-emerald-600', sourceError(errors, 'attendanceToday'), 'Present today'),
    metric('Leave Requests', stats?.pendingLeaveRequests ?? leaves.length, '/leave', 'LV', 'bg-amber-500', sourceError(errors, 'pendingLeaves') || sourceError(errors, 'employeeLeaves'), 'Pending or recent'),
    metric('Projects', projects.length, access.canProject ? '/projects' : '/dashboard', 'PR', 'bg-indigo-600', sourceError(errors, 'projects'), access.canProject ? 'Tracked projects' : 'Restricted'),
    metric('Tasks', openIssues, access.canProject ? '/projects/issues' : '/dashboard', 'TK', 'bg-sky-600', sourceError(errors, 'issues'), access.canProject ? 'Open issues' : 'Restricted'),
    metric('CRM Leads', leads.length, access.canCrm ? '/crm/leads' : '/dashboard', 'LD', 'bg-rose-500', sourceError(errors, 'crmLeads'), access.canCrm ? 'Pipeline updates' : 'Restricted'),
    metric('Payslips', stats?.totalPayroll ?? payslips.length, access.canPayroll ? '/payslips' : '/profile', 'PY', 'bg-emerald-700', sourceError(errors, 'payslips') || sourceError(errors, 'employeePayslips'), 'Payroll records'),
    metric('Helpdesk', openTickets, '/helpdesk', 'HD', 'bg-slate-800', sourceError(errors, 'helpdeskTickets'), 'Open tickets'),
    metric('Notifications', notifications.length, '/notifications', 'NT', 'bg-violet-600', sourceError(errors, 'notifications'), 'Workspace alerts'),
  ];
};

const metric = (label, value, to, icon, tone, error, caption) => ({
  label,
  value: error ? '--' : Number(value || 0),
  to,
  icon,
  tone,
  error,
  caption: error?.message || caption,
});

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
    timestamp: item.createdAt || item.updatedAt,
    to: '/announcements',
    meta: ['Announcement'],
  }));

  employees.slice(0, 6).forEach((item) => items.push({
    id: item.id,
    type: 'employee',
    module: 'HR',
    tone: 'green',
    title: `${item.firstName || ''} ${item.lastName || ''}`.trim() || item.email || 'Employee joined',
    description: `${item.designation || 'Team member'} in ${item.departmentName || item.department?.name || 'Tanvox'} is in the active directory.`,
    actor: `${item.firstName || ''} ${item.lastName || ''}`.trim() || item.email || 'Employee',
    timestamp: item.joiningDate || item.createdAt,
    to: item.id ? `/employees/${item.id}` : '/employees',
    meta: [item.employeeCode || 'Employee', item.departmentName || item.department?.name || 'People'],
  }));

  attendance.slice(0, 6).forEach((item) => items.push({
    id: item.id || `${item.employeeId || 'me'}-${item.attendanceDate || todayIso()}`,
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
    title: `${item.issueKey || 'Task'}: ${item.title || 'Project issue'}`,
    description: `${item.projectName || 'Project'} is ${String(item.status || 'TODO').replaceAll('_', ' ')} with ${item.assigneeName || 'no assignee'} assigned.`,
    actor: item.assigneeName || item.reporterName || 'Project team',
    timestamp: item.updatedAt || item.createdAt,
    to: item.id ? `/projects/issues/${item.id}` : '/projects/issues',
    priority: item.priority,
    meta: [item.issueType || 'Task', item.projectKey || 'Project'],
  }));

  projects.slice(0, 5).forEach((item) => items.push({
    id: item.id,
    type: 'project',
    module: 'Projects',
    tone: 'Project',
    title: `${item.name || 'Project'} update`,
    description: `${item.projectKey || 'Project'} is ${String(item.status || 'ACTIVE').replaceAll('_', ' ')} under ${item.leadName || 'the project team'}.`,
    actor: item.leadName || 'Project office',
    timestamp: item.updatedAt || item.createdAt,
    to: item.id ? `/projects/${item.id}` : '/projects',
    priority: item.priority,
    meta: [item.projectKey || 'Project', item.status || 'Active'],
  }));

  leads.slice(0, 8).forEach((item) => items.push({
    id: item.id,
    type: 'lead',
    module: 'CRM',
    tone: 'CRM',
    title: `${item.name || item.company || 'Lead'} is in ${String(item.status || 'NEW').replaceAll('_', ' ')}`,
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
    timestamp: item.issuedDate || item.createdAt,
    to: '/payslips',
    meta: ['Payroll', 'Payslip'],
  }));

  tickets.slice(0, 7).forEach((item) => items.push({
    id: item.id || item.ticketNumber,
    type: 'ticket',
    module: 'Helpdesk',
    tone: item.status === 'RESOLVED' ? 'green' : 'amber',
    title: `${item.ticketNumber || 'Ticket'}: ${item.title || item.subject || 'Support request'}`,
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

const unwrapApiPayload = (response) => {
  const body = response?.data ?? response;
  if (body && typeof body === 'object' && 'data' in body) return body.data;
  return body;
};

const normalizeEntity = (payload) => {
  if (Array.isArray(payload)) return payload[0] || null;
  if (payload?.content && Array.isArray(payload.content)) return payload.content[0] || null;
  if (payload?.items && Array.isArray(payload.items)) return payload.items[0] || null;
  return payload || null;
};

const toArray = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.content)) return payload.content;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.records)) return payload.records;
  if (Array.isArray(payload.tickets)) return payload.tickets;
  if (Array.isArray(payload.notifications)) return payload.notifications;
  if (Array.isArray(payload.leads)) return payload.leads;
  if (Array.isArray(payload.projects)) return payload.projects;
  if (Array.isArray(payload.issues)) return payload.issues;
  return typeof payload === 'object' && payload.id ? [payload] : [];
};

const sourceError = (errors, key) => errors?.[key] || null;

const getDashboardAccess = (user) => ({
  canViewEmployees: hasPermission(user, [PERMISSIONS.EMPLOYEE_VIEW_ALL]),
  canApproveLeave: hasPermission(user, [PERMISSIONS.LEAVE_APPROVE]),
  canProject: hasRole(user, PROJECT_ROLES) && hasPermission(user, [
    PERMISSIONS.PROJECT_MANAGE,
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_UPDATE,
    PERMISSIONS.ISSUE_CREATE,
    PERMISSIONS.ISSUE_UPDATE,
  ]),
  canCrm: hasRole(user, CRM_ROLES) && hasPermission(user, [PERMISSIONS.CRM_VIEW, PERMISSIONS.CRM_MANAGE]),
  canPayroll: hasRole(user, FINANCE_ROLES) && hasPermission(user, [
    PERMISSIONS.PAYROLL_VIEW,
    PERMISSIONS.PAYROLL_MANAGE,
    PERMISSIONS.PAYSLIP_GENERATE,
  ]),
});

const isIntern = (employee) => {
  const text = `${employee?.employeeType || ''} ${employee?.designation || ''} ${employee?.role || ''}`.toLowerCase();
  return text.includes('intern');
};

const countPresentToday = (attendanceToday, attendance) => {
  if (attendanceToday && ['PRESENT', 'APPROVED', 'CHECKED_IN'].includes(String(attendanceToday.status || '').toUpperCase())) return 1;
  return attendance.filter((item) => item.attendanceDate === todayIso() && ['PRESENT', 'APPROVED', 'CHECKED_IN'].includes(String(item.status || '').toUpperCase())).length;
};

const displayName = (employee, user) => {
  if (employee?.firstName) return employee.firstName;
  return String(user?.email || 'there').split('@')[0];
};

export default DashboardPage;
