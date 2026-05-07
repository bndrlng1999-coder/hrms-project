import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { employeeAPI } from '../services/api';
import { PERMISSIONS, hasPermission } from '../auth/authorization';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../hooks/useNotification';
import { Avatar, EmptyState, StatusBadge } from '../components/social/SocialComponents';

const EmployeePage = () => {
  const { id } = useParams();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { showError, showSuccess } = useNotification();
  const canRemove = hasPermission(user, [PERMISSIONS.EMPLOYEE_DELETE]);
  const canEdit = hasPermission(user, [PERMISSIONS.EMPLOYEE_UPDATE]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await employeeAPI.getAll();
      setEmployees(res.data.data || []);
    } catch (error) {
      showError('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const removeEmployee = async (employee) => {
    if (removingId) return;
    if (!window.confirm(`Remove ${employee.firstName} ${employee.lastName}?`)) return;
    try {
      setRemovingId(employee.id);
      await employeeAPI.delete(employee.id);
      setEmployees((current) => current.map((item) => item.id === employee.id ? { ...item, isActive: false } : item));
      showSuccess('Employee disabled');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to remove employee');
    } finally {
      setRemovingId(null);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(emp.employeeCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(emp.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(emp.designation || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? emp.isActive : !emp.isActive);
    return matchesSearch && matchesStatus;
  });

  const selectedEmployee = useMemo(
    () => employees.find((employee) => String(employee.id) === String(id)),
    [employees, id]
  );

  useEffect(() => {
    if (selectedEmployee) {
      setEditForm(selectedEmployee);
      setEditing(false);
    }
  }, [selectedEmployee?.id]);

  const saveEmployee = async (event) => {
    event.preventDefault();
    if (!selectedEmployee || saving) return;
    try {
      setSaving(true);
      await employeeAPI.update(selectedEmployee.id, editForm);
      showSuccess('Employee profile updated');
      await fetchEmployees();
      setEditing(false);
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to update employee');
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = () => {
    const header = ['Code', 'Name', 'Email', 'Department', 'Designation', 'Phone', 'Status'];
    const rows = filteredEmployees.map((emp) => [
      emp.employeeCode,
      `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
      emp.email,
      emp.departmentName || '',
      emp.designation || '',
      emp.phoneNumber || '',
      emp.isActive ? 'Active' : 'Inactive',
    ]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell || '').replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'employees.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="page-shell text-center">Loading employees...</div>;

  return (
    <div className="page-shell">
      <div className="mb-8">
        <p className="section-eyebrow">Employee Management</p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">Employees</h1>
            <p className="mt-2 text-sm text-slate-500">Active and disabled employee records remain visible for audit-safe HR operations.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-secondary" onClick={exportCsv}>Export CSV</button>
            {user?.role === 'SUPER_ADMIN' && <Link className="btn btn-primary" to="/employees/add">Add employee</Link>}
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_220px]">
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field"
          />
          <select className="input-field" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="active">Active only</option>
            <option value="disabled">Disabled only</option>
          </select>
        </div>
      </div>

      {selectedEmployee && (
        <div className="card mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <Avatar name={`${selectedEmployee.firstName} ${selectedEmployee.lastName}`} size="lg" />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-primary-600">{selectedEmployee.employeeCode}</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">{selectedEmployee.firstName} {selectedEmployee.lastName}</h2>
                <p className="mt-1 text-sm text-slate-500">{selectedEmployee.designation || 'No designation'} - {selectedEmployee.departmentName || 'No department'}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge value={selectedEmployee.isActive ? 'Active' : 'Disabled'} tone={selectedEmployee.isActive ? 'success' : 'danger'} />
              {canEdit && <button type="button" className="btn btn-secondary" onClick={() => setEditing(!editing)}>{editing ? 'Cancel edit' : 'Edit profile'}</button>}
            </div>
          </div>

          {editing ? (
            <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={saveEmployee}>
              {['firstName', 'lastName', 'designation', 'phoneNumber', 'city', 'state', 'country', 'pincode'].map((field) => (
                <label key={field}>
                  <span className="mb-2 block text-sm font-bold text-slate-700">{labelize(field)}</span>
                  <input className="input-field" value={editForm[field] || ''} onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value })} />
                </label>
              ))}
              <label className="md:col-span-2">
                <span className="mb-2 block text-sm font-bold text-slate-700">Address</span>
                <textarea className="input-field min-h-24" value={editForm.address || ''} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
              </label>
              <div className="md:col-span-2">
                <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Saving...' : 'Save employee'}</button>
              </div>
            </form>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <ProfileMetric label="Email" value={selectedEmployee.email} />
              <ProfileMetric label="Phone" value={selectedEmployee.phoneNumber || '-'} />
              <ProfileMetric label="Joined" value={selectedEmployee.joiningDate || '-'} />
              <ProfileMetric label="Manager ID" value={selectedEmployee.managerId || '-'} />
            </div>
          )}
        </div>
      )}

      <div className="card">
        {filteredEmployees.length === 0 ? (
          <EmptyState title="No employees found" message="Try another search or status filter." />
        ) : (
          <div className="profile-card-grid">
            {filteredEmployees.map((emp) => (
              <article key={emp.id} className="employee-social-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <Avatar name={`${emp.firstName} ${emp.lastName}`} />
                    <div className="min-w-0">
                      <Link className="truncate text-lg font-black text-slate-950 hover:text-primary-700" to={`/employees/${emp.id}`}>{emp.firstName} {emp.lastName}</Link>
                      <p className="truncate text-sm font-semibold text-slate-500">{emp.designation || 'Team member'}</p>
                    </div>
                  </div>
                  <StatusBadge value={emp.isActive ? 'Active' : 'Disabled'} tone={emp.isActive ? 'success' : 'danger'} />
                </div>
                <div className="mt-5 grid gap-3">
                  <ProfileMetric label="Employee Code" value={emp.employeeCode} />
                  <ProfileMetric label="Department" value={emp.departmentName || '-'} />
                  <ProfileMetric label="Email" value={emp.email} />
                  <ProfileMetric label="Phone" value={emp.phoneNumber || '-'} />
                </div>
                <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  <Link className="btn btn-secondary flex-1" to={`/employees/${emp.id}`}>View Profile</Link>
                  {canRemove && (
                    <button type="button" className="btn btn-danger" disabled={removingId === emp.id || !emp.isActive} onClick={() => removeEmployee(emp)}>
                      {removingId === emp.id ? <span className="btn-spinner" /> : null}
                      Disable
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ProfileMetric = ({ label, value }) => (
  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
    <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-2 truncate text-sm font-bold text-slate-900">{value}</p>
  </div>
);

const labelize = (value) => value.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());

export default EmployeePage;
