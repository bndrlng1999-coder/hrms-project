import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../hooks/useNotification';
import { employeeAPI, payslipAPI, projectTrackerAPI } from '../services/api';
import { PERMISSIONS, hasPermission, rolePermissions } from '../auth/authorization';

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
  const { showError } = useNotification();
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectTrackerAPI.getNotifications()
      .then((res) => setRows(res.data.data || []))
      .catch((error) => showError(error.response?.data?.message || 'Failed to load notifications'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = rows.filter((row) => searchMatch(row, query, ['title', 'message', 'link']));

  return (
    <div className="page-shell">
      <Header eyebrow="Dashboard" title="Notifications" description="Recent workflow and project alerts." />
      <SearchBar value={query} onChange={setQuery} placeholder="Search notifications..." />
      <div className="card mt-6">
        {loading ? <Empty text="Loading notifications..." /> : filtered.length === 0 ? <Empty text="No notifications found" /> : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <Link key={item.id} to={item.link || '/dashboard'} className="block rounded-lg border border-slate-200 p-4 hover:border-primary-300 hover:bg-primary-50/40">
                <div className="font-bold text-slate-950">{item.title}</div>
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
  const [query, setQuery] = useState('');
  const roles = Object.entries(rolePermissions)
    .filter(([role]) => role.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="page-shell">
      <Header eyebrow="Admin & Settings" title="Roles & Permissions" description="Current role permission matrix from the frontend authorization registry." />
      <SearchBar value={query} onChange={setQuery} placeholder="Search roles..." />
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {roles.map(([role, permissions]) => (
          <div key={role} className="card">
            <h2 className="text-lg font-bold text-slate-950">{role}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {permissions.map((permission) => <span key={permission} className="badge bg-slate-100 text-slate-700">{permission}</span>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AuditLogsPage = () => (
  <div className="page-shell">
    <Header eyebrow="Admin & Settings" title="Audit Logs" description="Audit events are recorded by the backend, but no read endpoint is currently exposed." />
    <div className="card">
      <Empty text="No audit log API endpoint is available in the backend yet." />
    </div>
  </div>
);

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
