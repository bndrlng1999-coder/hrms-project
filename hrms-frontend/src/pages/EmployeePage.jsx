import React, { useState, useEffect } from 'react';
import { employeeAPI } from '../services/api';
import { PERMISSIONS, hasPermission } from '../auth/authorization';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../hooks/useNotification';

const EmployeePage = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const { showError, showSuccess } = useNotification();
  const canRemove = hasPermission(user, [PERMISSIONS.EMPLOYEE_DELETE]);

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
      showSuccess('Employee removed');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to remove employee');
    } finally {
      setRemovingId(null);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(emp.employeeCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(emp.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="page-shell text-center">Loading employees...</div>;

  return (
    <div className="page-shell">
      <div className="mb-8">
        <p className="section-eyebrow">Employee Management</p>
        <h1 className="text-3xl font-bold text-slate-950 mb-4">Employees</h1>
        <input
          type="text"
          placeholder="Search employees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field max-w-md"
        />
      </div>

      <div className="card">
        {filteredEmployees.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No employees found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-cell">Code</th>
                  <th className="table-cell">Name</th>
                  <th className="table-cell">Email</th>
                  <th className="table-cell">Department</th>
                  <th className="table-cell">Designation</th>
                  <th className="table-cell">Phone</th>
                  <th className="table-cell">Status</th>
                  {canRemove && <th className="table-cell">Action</th>}
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="table-row">
                    <td className="table-cell font-semibold">{emp.employeeCode}</td>
                    <td className="table-cell">{emp.firstName} {emp.lastName}</td>
                    <td className="table-cell">{emp.email}</td>
                    <td className="table-cell">{emp.departmentName || '-'}</td>
                    <td className="table-cell">{emp.designation || '-'}</td>
                    <td className="table-cell">{emp.phoneNumber || '-'}</td>
                    <td className="table-cell">
                      <span className={`badge ${emp.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {emp.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {canRemove && (
                      <td className="table-cell">
                        <button type="button" className="btn btn-danger" disabled={removingId === emp.id || !emp.isActive} onClick={() => removeEmployee(emp)}>
                          {removingId === emp.id ? <span className="btn-spinner" /> : null}
                          Remove
                        </button>
                      </td>
                    )}
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

export default EmployeePage;
