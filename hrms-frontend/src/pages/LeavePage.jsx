import React, { useState, useEffect } from 'react';
import { employeeAPI, leaveAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../hooks/useNotification';

const LeavePage = () => {
  const [leaves, setLeaves] = useState([]);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [decisionId, setDecisionId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const { user } = useAuth();
  const { showError, showSuccess } = useNotification();

  const [formData, setFormData] = useState({
    leaveType: 'CASUAL_LEAVE',
    fromDate: '',
    toDate: '',
    numberOfDays: 1,
    reason: '',
  });

  useEffect(() => {
    if (user?.id) {
      fetchLeaves();
    }
  }, [user]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const employeeRes = await employeeAPI.getByUserId(user.id);
      const currentEmployee = employeeRes.data.data;
      setEmployee(currentEmployee);

      const res = user.role === 'EMPLOYEE'
        ? await leaveAPI.getByEmployee(currentEmployee.id)
        : await leaveAPI.getPending();
      setLeaves(res.data.data || []);
    } catch (error) {
      showError('Failed to load leaves');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!employee?.id) {
      showError('Employee profile not found');
      return;
    }

    try {
      setSubmitting(true);
      await leaveAPI.apply({ ...formData, employeeId: employee.id });
      showSuccess('Leave applied successfully');
      setFormData({ leaveType: 'CASUAL_LEAVE', fromDate: '', toDate: '', numberOfDays: 1, reason: '' });
      setShowForm(false);
      fetchLeaves();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to apply leave');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecision = async (leaveId, action) => {
    if (decisionId) return;
    if (!window.confirm(`${action === 'approve' ? 'Approve' : 'Reject'} this leave request?`)) return;
    try {
      setDecisionId(leaveId);
      if (action === 'approve') {
        await leaveAPI.approve(leaveId, employee.id);
        showSuccess('Leave approved');
      } else {
        await leaveAPI.reject(leaveId);
        showSuccess('Leave rejected');
      }
      fetchLeaves();
    } catch (error) {
      showError(error.response?.data?.message || `Failed to ${action} leave`);
    } finally {
      setDecisionId(null);
    }
  };

  const canApprove = user?.role === 'ADMIN' || user?.role === 'HR' || user?.role === 'HR_MANAGER' || user?.role === 'MANAGER';

  if (loading) return <div className="p-8 text-center">Loading leaves...</div>;

  return (
    <div className="page-shell">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
        >
          {showForm ? 'Cancel' : 'Apply Leave'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-8">
          <h2 className="text-xl font-bold mb-4">Apply Leave</h2>
          <form onSubmit={handleApplyLeave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Leave Type</label>
                <select
                  value={formData.leaveType}
                  onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                  className="input-field"
                >
                  <option>CASUAL_LEAVE</option>
                  <option>SICK_LEAVE</option>
                  <option>EARNED_LEAVE</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">From Date</label>
                <input
                  type="date"
                  value={formData.fromDate}
                  onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">To Date</label>
                <input
                  type="date"
                  value={formData.toDate}
                  onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Number of Days</label>
                <input
                  type="number"
                  value={formData.numberOfDays}
                  onChange={(e) => setFormData({ ...formData, numberOfDays: parseInt(e.target.value) })}
                  className="input-field"
                  min="1"
                />
              </div>
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">Reason</label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="input-field"
                rows="4"
                placeholder="Enter reason for leave"
              ></textarea>
            </div>
            <button type="submit" disabled={submitting} className="btn btn-primary disabled:opacity-50">
              {submitting ? 'Applying...' : 'Apply Leave'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h2 className="text-xl font-bold mb-4">
          {canApprove ? 'Pending Leave Requests' : 'My Leave Requests'}
        </h2>
        {leaves.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No pending leaves</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-cell">Employee</th>
                  <th className="table-cell">Type</th>
                  <th className="table-cell">From</th>
                  <th className="table-cell">To</th>
                  <th className="table-cell">Days</th>
                  <th className="table-cell">Status</th>
                  {canApprove && <th className="table-cell">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave) => (
                  <tr key={leave.id} className="table-row">
                    <td className="table-cell">{leave.employeeName}</td>
                    <td className="table-cell">{leave.leaveType}</td>
                    <td className="table-cell">{leave.fromDate}</td>
                    <td className="table-cell">{leave.toDate}</td>
                    <td className="table-cell">{leave.numberOfDays}</td>
                    <td className="table-cell">
                      <span className="badge badge-warning">{leave.status}</span>
                    </td>
                    {canApprove && (
                      <td className="table-cell">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleDecision(leave.id, 'approve')}
                            disabled={decisionId === leave.id}
                            className="btn btn-primary"
                          >
                            {decisionId === leave.id ? 'Working...' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDecision(leave.id, 'reject')}
                            disabled={decisionId === leave.id}
                            className="btn btn-danger"
                          >
                            Reject
                          </button>
                        </div>
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

export default LeavePage;
