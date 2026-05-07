import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../hooks/useNotification';
import { adminAPI, employeeAPI, notificationAPI, payslipAPI, rolePermissionAPI } from '../services/api';
import { PERMISSIONS, hasPermission } from '../auth/authorization';

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export const ProfilePage = () => {
  const { user } = useAuth();
  const { showError, showSuccess } = useNotification();
  const [employee, setEmployee] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const canEdit = hasPermission(user, [PERMISSIONS.EMPLOYEE_UPDATE]);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    employeeAPI.getByUserId(user.id)
      .then((res) => {
        setEmployee(res.data.data);
        setForm(res.data.data || {});
      })
      .catch((error) => showError(error.response?.data?.message || 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const save = async (event) => {
    event.preventDefault();
    if (saving) return;
    try {
      setSaving(true);
      const res = await employeeAPI.update(employee.id, form);
      setEmployee(res.data.data);
      setForm(res.data.data);
      setEditing(false);
      showSuccess('Profile updated');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageState title="My Profile" message="Loading profile..." />;
  if (!employee) return <PageState title="My Profile" message="No employee profile is linked to this account." />;

  return (
    <div className="page-shell">
      <Header eyebrow="Dashboard" title="My Profile" description="Your employee record and contact details." />
      <form className="card grid gap-4 lg:grid-cols-2" onSubmit={save}>
        {['firstName', 'lastName', 'email', 'employeeCode', 'departmentName', 'designation', 'phoneNumber', 'city', 'state', 'country'].map((field) => (
          <label key={field} className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">{labelize(field)}</span>
            <input
              className="input-field"
              value={form[field] || ''}
              disabled={!editing || field === 'email' || field === 'employeeCode' || field === 'departmentName'}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            />
          </label>
        ))}
        <label className="block lg:col-span-2">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Address</span>
          <textarea className="input-field min-h-24" value={form.address || ''} disabled={!editing} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </label>
        <div className="flex gap-3 lg:col-span-2">
          {canEdit && !editing && <button type="button" className="btn btn-primary" onClick={() => setEditing(true)}>Edit profile</button>}
          {editing && <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Saving...' : 'Save changes'}</button>}
          {editing && <button type="button" className="btn btn-secondary" onClick={() => { setForm(employee); setEditing(false); }}>Cancel</button>}
        </div>
      </form>
    </div>
  );
};

export const NotificationsPage = () => {
  const { showError, showSuccess } = useNotification();
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    notificationAPI.getAll()
      .then((res) => setRows(res.data.data || []))
      .catch((error) => showError(error.response?.data?.message || 'Failed to load notifications'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const markAllRead = async () => {
    try {
      const res = await notificationAPI.markAllRead();
      setRows(res.data.data || []);
      showSuccess('Notifications marked as read');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to update notifications');
    }
  };

  const filtered = rows.filter((row) => searchMatch(row, query, ['title', 'message', 'link']));

  return (
    <div className="page-shell">
      <Header eyebrow="Dashboard" title="Notifications" description="Recent workflow and project alerts." action={<button type="button" className="btn btn-secondary" onClick={markAllRead}>Mark all read</button>} />
      <SearchBar value={query} onChange={setQuery} placeholder="Search notifications..." />
      <div className="card mt-6">
        {loading ? <Empty text="Loading notifications..." /> : filtered.length === 0 ? <Empty text="No notifications found" /> : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <Link key={item.id} to={item.link || '/dashboard'} className={`block rounded-lg border p-4 transition hover:border-primary-300 hover:bg-primary-50/40 ${item.readFlag ? 'border-slate-200 bg-white' : 'border-primary-200 bg-primary-50/60'}`}>
                <div className="flex items-center gap-2">
                  {!item.readFlag && <span className="h-2 w-2 rounded-full bg-primary-600" />}
                  <div className="font-bold text-slate-950">{item.title}</div>
                </div>
                <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                <p className="mt-2 text-xs font-semibold text-slate-400">{formatDate(item.createdAt)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const InternsPage = () => {
  const { user } = useAuth();
  const { showError } = useNotification();
  const [employees, setEmployees] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const canAdd = user?.role === 'SUPER_ADMIN' && hasPermission(user, [PERMISSIONS.USER_CREATE]);

  useEffect(() => {
    employeeAPI.getAll()
      .then((res) => setEmployees(res.data.data || []))
      .catch((error) => showError(error.response?.data?.message || 'Failed to load interns'))
      .finally(() => setLoading(false));
  }, []);

  const interns = employees
    .filter((employee) => /intern/i.test(`${employee.designation || ''} ${employee.employeeCode || ''} ${employee.email || ''}`))
    .filter((employee) => searchMatch(employee, query, ['firstName', 'lastName', 'email', 'employeeCode', 'designation']));

  return (
    <div className="page-shell">
      <Header eyebrow="People & HR" title="Interns" description="Intern profiles currently identified from designation or employee code." action={canAdd ? <Link className="btn btn-primary" to="/employees/add">Add intern</Link> : null} />
      <SearchBar value={query} onChange={setQuery} placeholder="Search interns..." />
      <DataTable
        loading={loading}
        emptyText="No interns found"
        columns={['Code', 'Name', 'Email', 'Designation', 'Status']}
        rows={interns.map((item) => [
          item.employeeCode,
          `${item.firstName} ${item.lastName}`,
          item.email,
          item.designation || '-',
          <span key="status" className={`badge ${item.isActive ? 'badge-success' : 'badge-danger'}`}>{item.isActive ? 'Active' : 'Inactive'}</span>,
        ])}
      />
    </div>
  );
};

export const FinancePage = ({ view = 'payroll' }) => {
  const { user } = useAuth();
  const { showError, showSuccess } = useNotification();
  const [employees, setEmployees] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const canGenerate = hasPermission(user, [PERMISSIONS.PAYSLIP_GENERATE, PERMISSIONS.PAYROLL_MANAGE]);
  const canEditSalary = hasPermission(user, [PERMISSIONS.EMPLOYEE_UPDATE, PERMISSIONS.PAYROLL_MANAGE]);

  const load = async () => {
    try {
      setLoading(true);
      const [employeeRes, payslipRes] = await Promise.all([employeeAPI.getAll(), payslipAPI.getAll()]);
      setEmployees(employeeRes.data.data || []);
      setPayslips(payslipRes.data.data || []);
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to load finance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const generate = async () => {
    if (generating) return;
    const now = new Date();
    try {
      setGenerating(true);
      await payslipAPI.generate({ month: now.getMonth() + 1, year: now.getFullYear() });
      showSuccess('Payslip generation request recorded');
      load();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to generate payslips');
    } finally {
      setGenerating(false);
    }
  };

  const filteredEmployees = employees.filter((item) => searchMatch(item, query, ['firstName', 'lastName', 'email', 'employeeCode', 'designation']));
  const totalPayroll = employees.reduce((sum, item) => sum + Number(item.basicSalary || 0), 0);

  const content = {
    payroll: (
      <DataTable loading={loading} emptyText="No payroll records found" columns={['Employee', 'Code', 'Designation', 'Basic Salary']} rows={filteredEmployees.map((item) => [`${item.firstName} ${item.lastName}`, item.employeeCode, item.designation || '-', currency.format(Number(item.basicSalary || 0))])} />
    ),
    salary: (
      <SalaryTable loading={loading} employees={filteredEmployees} canEdit={canEditSalary} onSaved={load} />
    ),
    generate: (
      <div className="card">
        <p className="text-sm text-slate-600">Generate payslips for the current payroll month using existing payroll data.</p>
        <button type="button" className="btn btn-primary mt-5" disabled={!canGenerate || generating} onClick={generate}>{generating ? 'Generating...' : 'Generate payslips'}</button>
      </div>
    ),
    reports: (
      <div className="grid gap-4 lg:grid-cols-3">
        <Metric label="Employees in payroll" value={employees.length} />
        <Metric label="Monthly salary base" value={currency.format(totalPayroll)} />
        <Metric label="Payslips issued" value={payslips.length} />
      </div>
    ),
  }[view];

  return (
    <div className="page-shell">
      <Header eyebrow="Finance" title={financeTitle(view)} description="Payroll, salary structure, payslip generation, and payroll reporting." action={canGenerate ? <button type="button" className="btn btn-primary" onClick={generate} disabled={generating}>{generating ? 'Generating...' : 'Generate payslips'}</button> : null} />
      {view !== 'generate' && <SearchBar value={query} onChange={setQuery} placeholder="Search employees..." />}
      <div className="mt-6">{content}</div>
    </div>
  );
};

export const RolesPermissionsPage = () => {
  const { user, refreshUser } = useAuth();
  const { showError, showSuccess } = useNotification();
  const [query, setQuery] = useState('');
  const [matrix, setMatrix] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [openSections, setOpenSections] = useState(() => new Set(permissionCategories.map((category) => category.id)));
  const [savingRole, setSavingRole] = useState('');
  const [loading, setLoading] = useState(true);
  const canEdit = user?.role === 'SUPER_ADMIN';

  const load = async () => {
    try {
      setLoading(true);
      const res = await rolePermissionAPI.getMatrix();
      const data = res.data.data;
      setMatrix(data);
      setDrafts(data.permissionsByRole || {});
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to load role permissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const allPermissions = matrix?.allPermissions || [];
  const roles = (matrix?.roles || [])
    .map((role) => String(role))
    .filter((role) => role.toLowerCase().includes(query.toLowerCase()));

  const toggleSection = (sectionId) => {
    setOpenSections((current) => {
      const next = new Set(current);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const togglePermission = (role, permission) => {
    if (!canEdit || role === 'SUPER_ADMIN') return;
    setDrafts((current) => {
      const currentSet = new Set(current[role] || []);
      if (currentSet.has(permission)) currentSet.delete(permission);
      else currentSet.add(permission);
      return { ...current, [role]: Array.from(currentSet) };
    });
  };

  const saveRole = async (role) => {
    if (!canEdit || role === 'SUPER_ADMIN' || savingRole) return;
    try {
      setSavingRole(role);
      const res = await rolePermissionAPI.updateRole(role, drafts[role] || []);
      setDrafts((current) => ({ ...current, [role]: res.data.data || [] }));
      showSuccess('Permissions updated successfully');
      if (role === user?.role) {
        await refreshUser();
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to update permissions');
    } finally {
      setSavingRole('');
    }
  };

  return (
    <div className="page-shell bg-[radial-gradient(circle_at_top_left,#dbeafe_0,#f8fafc_28%,#eef2ff_70%,#f8fafc_100%)]">
      <div className="sticky top-16 z-20 -mx-4 mb-8 border-b border-white/60 bg-white/70 px-4 py-5 shadow-lg shadow-slate-200/50 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-indigo-200 bg-white/80 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-indigo-700 shadow-sm">
              Tanvox Access Control
            </div>
            <h1 className="mt-3 text-3xl font-black text-slate-950">Roles & Permissions</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Manage role capabilities with database-backed permissions. Sidebar visibility, route guards, and backend authorities resolve from this matrix.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              className="input-field min-w-[260px] border-white/80 bg-white/80 shadow-lg shadow-indigo-100/70 backdrop-blur"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search roles..."
            />
            <div className="rounded-lg border border-white/70 bg-white/70 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">
              {roles.length} roles
            </div>
          </div>
        </div>
        {!canEdit && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm font-semibold text-amber-800">
            You can view permissions, but only SUPER_ADMIN can edit and save changes.
          </div>
        )}
      </div>

      {loading ? (
        <PermissionSkeleton />
      ) : roles.length === 0 ? (
        <div className="rounded-2xl border border-white/80 bg-white/75 p-12 text-center shadow-xl shadow-slate-200/70 backdrop-blur-xl">
          <p className="text-lg font-bold text-slate-950">No matching roles</p>
          <p className="mt-2 text-sm text-slate-500">Try a different search term.</p>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {roles.map((role) => (
            <RolePermissionCard
              key={role}
              role={role}
              permissions={role === 'SUPER_ADMIN' ? allPermissions : drafts[role] || []}
              allPermissions={allPermissions}
              canEdit={canEdit}
              openSections={openSections}
              onToggleSection={toggleSection}
              onTogglePermission={togglePermission}
              onSave={saveRole}
              saving={savingRole === role}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const permissionCategories = [
  {
    id: 'users',
    title: 'User Management',
    accent: 'from-indigo-500 to-blue-500',
    permissions: ['USER_CREATE', 'USER_VIEW', 'USER_UPDATE', 'USER_DELETE', 'ROLE_ASSIGN'],
  },
  {
    id: 'employees',
    title: 'Employee Management',
    accent: 'from-sky-500 to-cyan-500',
    permissions: ['EMPLOYEE_VIEW_ALL', 'EMPLOYEE_VIEW_SELF', 'EMPLOYEE_CREATE', 'EMPLOYEE_UPDATE', 'EMPLOYEE_DELETE', 'INTERN_CREATE'],
  },
  {
    id: 'payroll',
    title: 'Payroll',
    accent: 'from-emerald-500 to-teal-500',
    permissions: ['PAYROLL_VIEW', 'PAYROLL_MANAGE', 'PAYSLIP_CREATE', 'PAYSLIP_GENERATE', 'PAYSLIP_SEND'],
  },
  {
    id: 'leave-attendance',
    title: 'Leave & Attendance',
    accent: 'from-violet-500 to-purple-500',
    permissions: ['LEAVE_APPLY', 'LEAVE_APPROVE', 'ATTENDANCE_VIEW', 'ATTENDANCE_MANAGE', 'ATTENDANCE_APPROVE'],
  },
  {
    id: 'operations',
    title: 'Company Operations',
    accent: 'from-fuchsia-500 to-rose-500',
    permissions: ['ANNOUNCEMENT_CREATE', 'ANNOUNCEMENT_UPDATE', 'HOLIDAY_CREATE', 'HOLIDAY_UPDATE', 'SHIFT_CREATE', 'SHIFT_ASSIGN'],
  },
  {
    id: 'helpdesk',
    title: 'Helpdesk',
    accent: 'from-amber-500 to-orange-500',
    permissions: ['HELPDESK_REPLY', 'HELPDESK_MANAGE'],
  },
  {
    id: 'advanced',
    title: 'Advanced Modules',
    accent: 'from-slate-700 to-indigo-700',
    permissions: [
      'PROJECT_CREATE', 'PROJECT_UPDATE', 'PROJECT_MANAGE', 'SPRINT_CREATE', 'SPRINT_UPDATE',
      'ISSUE_CREATE', 'ISSUE_ASSIGN', 'ISSUE_UPDATE', 'ISSUE_DELETE',
      'INTERNAL_MAIL_SEND', 'INTERNAL_MAIL_VIEW', 'CRM_VIEW', 'CRM_MANAGE', 'CRM_APPROVE',
      'REPORT_VIEW', 'SETTINGS_MANAGE', 'AUDIT_VIEW',
    ],
  },
];

const RolePermissionCard = ({
  role,
  permissions,
  allPermissions,
  canEdit,
  openSections,
  onToggleSection,
  onTogglePermission,
  onSave,
  saving,
}) => {
  const permissionSet = new Set(permissions);
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const enabledCount = isSuperAdmin ? allPermissions.length : permissionSet.size;

  return (
    <section className="group rounded-[1.4rem] bg-gradient-to-br from-indigo-400/70 via-blue-400/40 to-purple-500/70 p-px shadow-2xl shadow-indigo-200/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-indigo-300/70">
      <div className="h-full rounded-[1.35rem] border border-white/70 bg-white/75 p-5 backdrop-blur-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 to-indigo-800 text-sm font-black text-white shadow-lg shadow-indigo-300/60">
              {role.split('_').map((part) => part[0]).join('').slice(0, 2)}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-950">{role.replaceAll('_', ' ')}</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">{enabledCount} of {allPermissions.length} permissions enabled</p>
            </div>
          </div>
          <div className="rounded-full border border-white/80 bg-white/80 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-indigo-700 shadow-sm">
            {isSuperAdmin ? 'Locked' : canEdit ? 'Editable' : 'View only'}
          </div>
        </div>

        {isSuperAdmin && (
          <div className="mb-5 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50 px-4 py-3 text-sm font-semibold text-indigo-800 shadow-inner">
            Super Admin has full system access and cannot be restricted.
          </div>
        )}

        <div className="max-h-[34rem] space-y-3 overflow-y-auto pr-1">
          {permissionCategories.map((category) => {
            const sectionPermissions = category.permissions.filter((permission) => allPermissions.includes(permission));
            if (!sectionPermissions.length) return null;
            const sectionEnabled = sectionPermissions.filter((permission) => permissionSet.has(permission)).length;
            const isOpen = openSections.has(category.id);

            return (
              <div key={category.id} className="overflow-hidden rounded-2xl border border-white/70 bg-white/70 shadow-sm shadow-slate-200/70">
                <button
                  type="button"
                  onClick={() => onToggleSection(category.id)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-white/90"
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-8 w-1.5 rounded-full bg-gradient-to-b ${category.accent}`} />
                    <div>
                      <p className="font-black text-slate-900">{category.title}</p>
                      <p className="text-xs font-semibold text-slate-500">{sectionEnabled}/{sectionPermissions.length} enabled</p>
                    </div>
                  </div>
                  <span className={`text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}>›</span>
                </button>

                <div className={`grid transition-all duration-300 ease-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <div className="grid gap-2 px-4 pb-4">
                      {sectionPermissions.map((permission) => (
                        <PermissionToggleRow
                          key={permission}
                          permission={permission}
                          enabled={isSuperAdmin || permissionSet.has(permission)}
                          disabled={isSuperAdmin || !canEdit}
                          onToggle={() => onTogglePermission(role, permission)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!isSuperAdmin && canEdit && (
          <button
            type="button"
            onClick={() => onSave(role)}
            disabled={saving}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 px-5 py-3 text-sm font-black text-white shadow-xl shadow-indigo-300/60 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-indigo-400/70 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving && <span className="btn-spinner" />}
            {saving ? 'Saving permissions...' : 'Save Permissions'}
          </button>
        )}
      </div>
    </section>
  );
};

const PermissionToggleRow = ({ permission, enabled, disabled, onToggle }) => (
  <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/70 bg-gradient-to-r from-white to-slate-50/80 px-3 py-2.5 shadow-sm transition-all duration-200 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-100/60">
    <div>
      <p className="text-sm font-bold text-slate-800">{permission}</p>
      <p className="text-xs text-slate-400">{permission.toLowerCase().replaceAll('_', ' ')}</p>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={onToggle}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-all duration-300 ${
        enabled
          ? 'bg-emerald-500 shadow-lg shadow-emerald-300/70'
          : 'bg-slate-300 shadow-inner'
      } ${disabled ? 'cursor-not-allowed opacity-80' : 'hover:scale-105'}`}
    >
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-md transition-all duration-300 ${enabled ? 'left-6' : 'left-1'}`} />
    </button>
  </div>
);

const PermissionSkeleton = () => (
  <div className="grid gap-6 xl:grid-cols-2">
    {[0, 1, 2, 3].map((item) => (
      <div key={item} className="rounded-[1.4rem] border border-white/70 bg-white/70 p-5 shadow-xl shadow-slate-200/70 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 animate-pulse rounded-2xl bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 animate-pulse rounded-full bg-slate-200" />
            <div className="h-3 w-28 animate-pulse rounded-full bg-slate-100" />
          </div>
        </div>
        <div className="mt-6 space-y-3">
          {[0, 1, 2].map((row) => <div key={row} className="h-16 animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
      </div>
    ))}
  </div>
);

export const AuditLogsPage = () => {
  const { showError } = useNotification();
  const [logs, setLogs] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getAuditLogs()
      .then((res) => setLogs(res.data.data || []))
      .catch((error) => showError(error.response?.data?.message || 'Failed to load audit logs'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter((log) => searchMatch(log, query, ['actorEmail', 'module', 'action', 'entityType', 'details']));

  return (
    <div className="page-shell">
      <Header eyebrow="Admin & Settings" title="Audit Logs" description="Database-backed activity trail for sensitive operations." />
      <SearchBar value={query} onChange={setQuery} placeholder="Search audit logs..." />
      <DataTable
        loading={loading}
        emptyText="No audit events found"
        columns={['Time', 'Actor', 'Module', 'Action', 'Entity', 'Details']}
        rows={filtered.map((log) => [
          formatDate(log.createdAt),
          log.actorEmail || '-',
          log.module,
          log.action,
          log.entityType ? `${log.entityType} #${log.entityId || '-'}` : '-',
          log.details || '-',
        ])}
      />
    </div>
  );
};

export const SystemSettingsPage = () => {
  const [settings, setSettings] = useState({ apiBase: import.meta.env.VITE_API_BASE_URL || '/api', environment: import.meta.env.MODE, notifications: true });

  return (
    <div className="page-shell">
      <Header eyebrow="Admin & Settings" title="System Settings" description="Runtime configuration visible to the frontend client." />
      <div className="card grid gap-4 lg:grid-cols-2">
        <label>
          <span className="mb-2 block text-sm font-semibold text-slate-700">API base URL</span>
          <input className="input-field" value={settings.apiBase} onChange={(e) => setSettings({ ...settings, apiBase: e.target.value })} />
        </label>
        <label>
          <span className="mb-2 block text-sm font-semibold text-slate-700">Environment</span>
          <input className="input-field" value={settings.environment} onChange={(e) => setSettings({ ...settings, environment: e.target.value })} />
        </label>
        <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-4">
          <input type="checkbox" checked={settings.notifications} onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })} />
          <span className="text-sm font-semibold text-slate-700">Enable in-app notification indicators</span>
        </label>
      </div>
    </div>
  );
};

const SalaryTable = ({ loading, employees, canEdit, onSaved }) => {
  const { showError, showSuccess } = useNotification();
  const [savingId, setSavingId] = useState(null);
  const [drafts, setDrafts] = useState({});

  const save = async (employee) => {
    try {
      setSavingId(employee.id);
      await employeeAPI.update(employee.id, { ...employee, basicSalary: drafts[employee.id] ?? employee.basicSalary ?? 0 });
      showSuccess('Salary structure updated');
      onSaved();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to update salary');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <DataTable
      loading={loading}
      emptyText="No salary structures found"
      columns={['Employee', 'Code', 'Current Salary', canEdit ? 'Action' : '']}
      rows={employees.map((item) => [
        `${item.firstName} ${item.lastName}`,
        item.employeeCode,
        canEdit ? <input className="input-field max-w-44" type="number" value={drafts[item.id] ?? item.basicSalary ?? 0} onChange={(e) => setDrafts({ ...drafts, [item.id]: e.target.value })} /> : currency.format(Number(item.basicSalary || 0)),
        canEdit ? <button type="button" className="btn btn-secondary" disabled={savingId === item.id} onClick={() => save(item)}>{savingId === item.id ? 'Saving...' : 'Save'}</button> : '',
      ])}
    />
  );
};

const Header = ({ eyebrow, title, description, action }) => (
  <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <p className="section-eyebrow">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-950">{title}</h1>
      {description && <p className="mt-2 text-sm text-slate-500">{description}</p>}
    </div>
    {action}
  </div>
);

const SearchBar = ({ value, onChange, placeholder }) => (
  <input className="input-field max-w-md" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
);

const DataTable = ({ loading, emptyText, columns, rows }) => (
  <div className="card overflow-x-auto">
    {loading ? <Empty text="Loading..." /> : rows.length === 0 ? <Empty text={emptyText} /> : (
      <table className="table">
        <thead className="table-header">
          <tr>{columns.filter(Boolean).map((column) => <th key={column} className="table-cell">{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="table-row">
              {row.filter((_, cellIndex) => Boolean(columns[cellIndex])).map((cell, cellIndex) => <td key={cellIndex} className="table-cell">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

const Metric = ({ label, value }) => (
  <div className="metric-card">
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
  </div>
);

const PageState = ({ title, message }) => (
  <div className="page-shell">
    <Header eyebrow="Dashboard" title={title} />
    <div className="card"><Empty text={message} /></div>
  </div>
);

const Empty = ({ text }) => <div className="py-10 text-center text-slate-500">{text}</div>;

const searchMatch = (item, query, fields) => {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return fields.some((field) => String(item[field] || '').toLowerCase().includes(needle));
};

const labelize = (value) => value.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
const formatDate = (value) => value ? new Date(value).toLocaleString() : '-';
const financeTitle = (view) => ({
  payroll: 'Payroll',
  salary: 'Salary Structure',
  generate: 'Generate Payslip',
  reports: 'Payroll Reports',
}[view] || 'Finance');
