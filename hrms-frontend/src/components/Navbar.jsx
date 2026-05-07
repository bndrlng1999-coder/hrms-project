import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { crmAPI, employeeAPI, helpdeskAPI, notificationAPI, projectTrackerAPI } from '../services/api';
import { PERMISSIONS, hasPermission } from '../auth/authorization';
import { useNotification } from '../hooks/useNotification';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showError, showSuccess } = useNotification();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [openPanel, setOpenPanel] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('hrms.theme') || 'light');
  const searchRef = useRef(null);

  const unreadCount = notifications.filter((item) => !item.readFlag).length;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('hrms.theme', theme);
  }, [theme]);

  useEffect(() => {
    loadNotifications();
    const intervalId = window.setInterval(loadNotifications, 60000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearching(false);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => runGlobalSearch(trimmed), 250);
    return () => window.clearTimeout(timeoutId);
  }, [query, user?.role, user?.permissions]);

  const quickActions = useMemo(() => ([
    { label: 'Add employee', to: '/employees/add', show: user?.role === 'SUPER_ADMIN' && hasPermission(user, [PERMISSIONS.USER_CREATE]) },
    { label: 'New issue', to: '/projects/issues', show: hasPermission(user, [PERMISSIONS.ISSUE_CREATE, PERMISSIONS.ISSUE_UPDATE]) },
    { label: 'CRM lead', to: '/crm/leads', show: hasPermission(user, [PERMISSIONS.CRM_MANAGE]) },
    { label: 'Apply leave', to: '/leave', show: hasPermission(user, [PERMISSIONS.LEAVE_APPLY]) },
    { label: 'Compose mail', to: '/mail/compose', show: hasPermission(user, [PERMISSIONS.INTERNAL_MAIL_SEND]) },
    { label: 'Helpdesk ticket', to: '/helpdesk', show: true },
  ].filter((item) => item.show)), [user]);

  const loadNotifications = async () => {
    try {
      const response = await notificationAPI.getAll();
      setNotifications(response.data.data || []);
    } catch {
      setNotifications([]);
    }
  };

  const runGlobalSearch = async (term) => {
    try {
      setSearching(true);
      const calls = [];
      if (hasPermission(user, [PERMISSIONS.EMPLOYEE_VIEW_ALL, PERMISSIONS.EMPLOYEE_VIEW_SELF])) calls.push(['Employee', employeeAPI.getAll()]);
      if (hasPermission(user, [PERMISSIONS.PROJECT_MANAGE, PERMISSIONS.PROJECT_CREATE, PERMISSIONS.PROJECT_UPDATE, PERMISSIONS.ISSUE_UPDATE])) calls.push(['Project', projectTrackerAPI.getProjects()]);
      if (hasPermission(user, [PERMISSIONS.ISSUE_CREATE, PERMISSIONS.ISSUE_UPDATE])) calls.push(['Issue', projectTrackerAPI.getIssues()]);
      if (hasPermission(user, [PERMISSIONS.CRM_VIEW, PERMISSIONS.CRM_MANAGE])) calls.push(['Lead', crmAPI.getLeads()]);
      calls.push(['Ticket', helpdeskAPI.getTickets()]);

      const settled = await Promise.allSettled(calls.map(([, promise]) => promise));
      const needle = term.toLowerCase();
      const nextResults = settled.flatMap((result, index) => {
        if (result.status !== 'fulfilled') return [];
        const type = calls[index][0];
        const data = type === 'Ticket'
          ? result.value.data.data?.tickets || []
          : result.value.data.data || [];
        return data
          .map((item) => normalizeSearchResult(type, item))
          .filter((item) => `${item.title} ${item.meta}`.toLowerCase().includes(needle));
      }).slice(0, 10);
      setResults(nextResults);
    } finally {
      setSearching(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const openNotification = async (item) => {
    try {
      if (!item.readFlag) await notificationAPI.markRead(item.id);
      await loadNotifications();
      navigate(item.link || '/notifications');
      setOpenPanel('');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to open notification');
    }
  };

  const markAllRead = async () => {
    try {
      const response = await notificationAPI.markAllRead();
      setNotifications(response.data.data || []);
      showSuccess('Notifications marked as read');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to update notifications');
    }
  };

  return (
    <nav className="fixed inset-x-0 top-0 z-40 border-b border-slate-200/80 bg-white/90 shadow-sm shadow-slate-900/5 backdrop-blur-xl">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center gap-3">
          <Link to="/dashboard" className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-primary-900 to-cyan-700 text-sm font-black text-white shadow-lg shadow-primary-900/20">TX</div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-black text-slate-950">Tanvox HRMS</h1>
              <p className="text-xs font-medium text-slate-500">Enterprise command center</p>
            </div>
          </Link>

          <div className="relative mx-auto hidden w-full max-w-2xl md:block" ref={searchRef}>
            <input
              className="input-field h-11 rounded-full border-slate-200 bg-slate-50 pl-11 pr-4 shadow-inner"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setOpenPanel('search');
              }}
              onFocus={() => setOpenPanel('search')}
              placeholder="Search employees, projects, CRM, tickets..."
            />
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">/</span>
            {openPanel === 'search' && query.trim().length >= 2 && (
              <div className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-900/12">
                {searching ? <PanelState text="Searching..." /> : results.length === 0 ? <PanelState text="No matching records" /> : (
                  <div className="max-h-96 overflow-y-auto py-2">
                    {results.map((item) => (
                      <Link
                        key={`${item.type}-${item.id}`}
                        to={item.to}
                        onClick={() => {
                          setOpenPanel('');
                          setQuery('');
                        }}
                        className="flex items-center gap-3 px-4 py-3 transition hover:bg-primary-50"
                      >
                        <Avatar label={item.type} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900">{item.title}</p>
                          <p className="truncate text-xs text-slate-500">{item.type} - {item.meta}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <DropdownButton label="Quick actions" active={openPanel === 'quick'} onClick={() => setOpenPanel(openPanel === 'quick' ? '' : 'quick')}>+</DropdownButton>
            <DropdownButton label="Notifications" active={openPanel === 'notifications'} onClick={() => setOpenPanel(openPanel === 'notifications' ? '' : 'notifications')}>
              <span>!</span>
              {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white">{unreadCount}</span>}
            </DropdownButton>
            <button
              type="button"
              className="hidden h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-sm font-black text-slate-700 transition hover:border-primary-200 hover:bg-primary-50 sm:flex"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? 'D' : 'L'}
            </button>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-700 to-cyan-600 text-xs font-black text-white shadow-lg shadow-primary-900/20"
              onClick={() => setOpenPanel(openPanel === 'profile' ? '' : 'profile')}
              aria-label="Open profile menu"
            >
              {initials(user?.email)}
            </button>
          </div>
        </div>
      </div>

      {openPanel === 'quick' && (
        <FloatingPanel right="right-24">
          <div className="p-2">
            {quickActions.map((item) => (
              <Link key={item.to} to={item.to} onClick={() => setOpenPanel('')} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-primary-50 hover:text-primary-800">
                <Avatar label={item.label} />
                {item.label}
              </Link>
            ))}
          </div>
        </FloatingPanel>
      )}

      {openPanel === 'notifications' && (
        <FloatingPanel right="right-16" wide>
          <div className="border-b border-slate-100 px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="font-black text-slate-950">Notifications</p>
              <button type="button" className="text-xs font-bold text-primary-700" onClick={markAllRead}>Mark all read</button>
            </div>
          </div>
          {notifications.length === 0 ? <PanelState text="No notifications yet" /> : (
            <div className="max-h-96 overflow-y-auto p-2">
              {notifications.slice(0, 8).map((item) => (
                <button key={item.id} type="button" onClick={() => openNotification(item)} className={`flex w-full gap-3 rounded-md px-3 py-3 text-left transition hover:bg-primary-50 ${item.readFlag ? '' : 'bg-primary-50/70'}`}>
                  <Avatar label={item.title} active={!item.readFlag} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-slate-900">{item.title}</span>
                    <span className="mt-1 block text-xs text-slate-500">{item.message}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </FloatingPanel>
      )}

      {openPanel === 'profile' && (
        <FloatingPanel right="right-4">
          <div className="border-b border-slate-100 p-4">
            <div className="flex items-center gap-3">
              <Avatar label={user?.email} large />
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-950">{user?.email}</p>
                <p className="text-xs font-bold text-primary-700">{user?.role}</p>
              </div>
            </div>
          </div>
          <div className="p-2">
            <Link to="/profile" onClick={() => setOpenPanel('')} className="block rounded-md px-3 py-2 text-sm font-bold text-slate-700 hover:bg-primary-50">My profile</Link>
            <Link to="/notifications" onClick={() => setOpenPanel('')} className="block rounded-md px-3 py-2 text-sm font-bold text-slate-700 hover:bg-primary-50">Notifications</Link>
            <button type="button" onClick={handleLogout} className="mt-1 w-full rounded-md px-3 py-2 text-left text-sm font-bold text-red-700 hover:bg-red-50">Logout</button>
          </div>
        </FloatingPanel>
      )}
    </nav>
  );
};

const normalizeSearchResult = (type, item) => {
  if (type === 'Employee') {
    return { type, id: item.id, title: `${item.firstName || ''} ${item.lastName || ''}`.trim() || item.email, meta: `${item.employeeCode || ''} ${item.email || ''} ${item.departmentName || ''}`, to: `/employees/${item.id}` };
  }
  if (type === 'Project') {
    return { type, id: item.id, title: item.name, meta: `${item.projectKey || ''} ${item.status || ''} ${item.leadName || ''}`, to: `/projects/${item.id}` };
  }
  if (type === 'Issue') {
    return { type, id: item.id, title: item.title, meta: `${item.issueKey || ''} ${item.status || ''} ${item.assigneeName || ''}`, to: `/projects/issues/${item.id}` };
  }
  if (type === 'Lead') {
    return { type, id: item.id, title: item.name, meta: `${item.company || ''} ${item.email || ''} ${item.status || ''}`, to: '/crm/leads' };
  }
  return { type, id: item.id || item.ticketNumber, title: item.title, meta: `${item.ticketNumber || ''} ${item.status || ''} ${item.category || ''}`, to: '/helpdesk' };
};

const FloatingPanel = ({ children, right, wide }) => (
  <div className={`absolute top-16 z-50 ${right} mt-2 ${wide ? 'w-96' : 'w-80'} max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-900/15`}>
    {children}
  </div>
);

const DropdownButton = ({ children, label, active, onClick }) => (
  <button
    type="button"
    className={`relative flex h-10 w-10 items-center justify-center rounded-md border text-sm font-black transition ${active ? 'border-primary-300 bg-primary-50 text-primary-800' : 'border-slate-200 bg-white text-slate-700 hover:border-primary-200 hover:bg-primary-50'}`}
    onClick={onClick}
    aria-label={label}
  >
    {children}
  </button>
);

const Avatar = ({ label, active, large }) => (
  <span className={`flex shrink-0 items-center justify-center rounded-full font-black ${large ? 'h-11 w-11 text-sm' : 'h-9 w-9 text-xs'} ${active ? 'bg-primary-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
    {initials(label)}
  </span>
);

const PanelState = ({ text }) => <div className="px-4 py-8 text-center text-sm font-semibold text-slate-500">{text}</div>;

const initials = (value = '') => {
  const clean = String(value).replace(/@.*/, '').replace(/[^a-zA-Z0-9]+/g, ' ').trim();
  if (!clean) return 'TX';
  return clean.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
};

export default Navbar;
