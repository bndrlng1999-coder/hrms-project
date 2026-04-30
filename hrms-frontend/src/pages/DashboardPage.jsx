import React, { useState, useEffect } from 'react';
import { dashboardAPI, employeeAPI } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS, hasPermission } from '../auth/authorization';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useNotification();
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const canViewEmployees = hasPermission(user, [PERMISSIONS.EMPLOYEE_VIEW_ALL]);
      const [statsRes, empRes] = await Promise.all([
        dashboardAPI.getStats(),
        canViewEmployees ? employeeAPI.getAll() : Promise.resolve({ data: { data: [] } }),
      ]);
      setStats(statsRes.data.data);
      setEmployees(empRes.data.data);
    } catch (error) {
      showError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="page-shell text-center">Loading dashboard...</div>;

  return (
    <div className="page-shell">
      <div className="mb-8 flex flex-col gap-2">
        <p className="section-eyebrow">Workspace Overview</p>
        <h1 className="text-3xl font-bold text-slate-950">Dashboard</h1>
        <p className="text-sm text-slate-500">Role-aware view of people, operations, payroll, and work activity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Employees</p>
              <p className="text-3xl font-bold text-primary-600">{stats?.totalEmployees || 0}</p>
            </div>
            <span className="metric-icon">EM</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Present Today</p>
              <p className="text-3xl font-bold text-green-600">{stats?.presentToday || 0}</p>
            </div>
            <span className="metric-icon metric-icon-success">IN</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Absent Today</p>
              <p className="text-3xl font-bold text-red-600">{stats?.absentToday || 0}</p>
            </div>
            <span className="metric-icon metric-icon-danger">AB</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Pending Leaves</p>
              <p className="text-3xl font-bold text-yellow-600">{stats?.pendingLeaveRequests || 0}</p>
            </div>
            <span className="metric-icon metric-icon-warning">LV</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Payroll</p>
              <p className="text-3xl font-bold text-blue-600">0</p>
            </div>
            <span className="metric-icon metric-icon-accent">PY</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-bold mb-4">Recent Employees</h2>
        {employees.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No employees found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-cell">Employee Code</th>
                  <th className="table-cell">Name</th>
                  <th className="table-cell">Email</th>
                  <th className="table-cell">Department</th>
                  <th className="table-cell">Status</th>
                </tr>
              </thead>
              <tbody>
                {employees.slice(0, 5).map((emp) => (
                  <tr key={emp.id} className="table-row">
                    <td className="table-cell">{emp.employeeCode}</td>
                    <td className="table-cell">{emp.firstName} {emp.lastName}</td>
                    <td className="table-cell">{emp.email}</td>
                    <td className="table-cell">{emp.departmentName || '-'}</td>
                    <td className="table-cell">
                      <span className={`badge ${emp.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {emp.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
