import React, { useEffect, useState } from 'react';
import { departmentAPI, employeeAPI, userAdminAPI } from '../services/api';
import { useNotification } from '../hooks/useNotification';

const roles = ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'CEO', 'CTO', 'HR_MANAGER', 'HR', 'PROJECT_MANAGER', 'TEAM_LEAD', 'DEVELOPER', 'EMPLOYEE', 'INTERN'];

const UserAdminPage = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [tempPassword, setTempPassword] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', role: 'EMPLOYEE', departmentId: '', designation: '', reportingManagerId: '' });
  const { showError, showSuccess } = useNotification();

  const load = async () => {
    try {
      const [userRes, deptRes, employeeRes] = await Promise.all([userAdminAPI.getAll(), departmentAPI.getAll(), employeeAPI.getAll()]);
      setUsers(userRes.data.data || []);
      setDepartments(deptRes.data.data || []);
      setEmployees(employeeRes.data.data || []);
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to load admin users');
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        departmentId: form.departmentId ? Number(form.departmentId) : null,
        reportingManagerId: form.reportingManagerId ? Number(form.reportingManagerId) : null,
      };
      const res = await userAdminAPI.create(payload);
      setTempPassword(res.data.data?.temporaryPassword || '');
      showSuccess('User created');
      setForm({ firstName: '', lastName: '', email: '', role: 'EMPLOYEE', departmentId: '', designation: '', reportingManagerId: '' });
      load();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to create user');
    }
  };

  const toggle = async (user) => {
    try {
      if (user.accountStatus === 'DISABLED' || !user.isActive) await userAdminAPI.enable(user.id);
      else await userAdminAPI.disable(user.id);
      showSuccess('User status updated');
      load();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to update user');
    }
  };

  const resetPassword = async (user) => {
    try {
      const res = await userAdminAPI.resetPassword(user.id);
      setTempPassword(res.data.data);
      showSuccess('Temporary password generated');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to reset password');
    }
  };

  return (
    <div className="page-shell">
      <p className="section-eyebrow">SUPER_ADMIN only</p>
      <h1 className="mb-6 text-3xl font-bold text-slate-950">Admin Users</h1>
      {tempPassword && <div className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">Temporary password: {tempPassword}</div>}

      <form className="card mb-6 grid gap-3 lg:grid-cols-4" onSubmit={submit}>
        <input className="input-field" placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
        <input className="input-field" placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
        <input className="input-field" placeholder="Internal email auto-generates if blank" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <select className="input-field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{roles.map((role) => <option key={role}>{role}</option>)}</select>
        <select className="input-field" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
          <option value="">No department</option>
          {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
        </select>
        <input className="input-field" placeholder="Designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
        <select className="input-field" value={form.reportingManagerId} onChange={(e) => setForm({ ...form, reportingManagerId: e.target.value })}>
          <option value="">No manager</option>
          {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.firstName} {employee.lastName}</option>)}
        </select>
        <button className="btn btn-primary">Create user</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead className="table-header">
            <tr><th className="table-cell">Email</th><th className="table-cell">Role</th><th className="table-cell">Employee ID</th><th className="table-cell">Status</th><th className="table-cell">Actions</th></tr>
          </thead>
          <tbody>
            {users.map((item) => (
              <tr key={item.id} className="table-row">
                <td className="table-cell">{item.email}</td>
                <td className="table-cell">{item.role}</td>
                <td className="table-cell">{item.employeeCode || '-'}</td>
                <td className="table-cell"><span className={`badge ${item.accountStatus === 'DISABLED' ? 'badge-danger' : 'badge-success'}`}>{item.accountStatus}</span></td>
                <td className="table-cell flex gap-2">
                  <button className="btn btn-secondary" onClick={() => resetPassword(item)}>Reset</button>
                  <button className={item.accountStatus === 'DISABLED' ? 'btn btn-primary' : 'btn btn-danger'} onClick={() => toggle(item)}>
                    {item.accountStatus === 'DISABLED' ? 'Enable' : 'Disable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserAdminPage;
