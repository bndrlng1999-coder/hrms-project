import React, { useEffect, useMemo, useState } from 'react';
import { attendanceAPI } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import { useSingleFlight } from '../hooks/useSingleFlight';

const AttendanceApprovalsPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');
  const [filters, setFilters] = useState({ date: '', department: '', status: 'PENDING_APPROVAL' });
  const { loading: acting, run } = useSingleFlight();
  const { showError, showSuccess } = useNotification();

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getPendingApprovals();
      setRecords(response.data.data || []);
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to load attendance approvals');
    } finally {
      setLoading(false);
    }
  };

  const departments = useMemo(() => {
    return [...new Set(records.map((item) => item.departmentName).filter(Boolean))].sort();
  }, [records]);

  const visibleRecords = useMemo(() => {
    return records.filter((item) => {
      if (filters.date && item.attendanceDate !== filters.date) return false;
      if (filters.department && item.departmentName !== filters.department) return false;
      if (filters.status && item.status !== filters.status) return false;
      return true;
    });
  }, [records, filters]);

  const toggleSelected = (id) => {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const approveOne = async (id) => {
    await run(async () => {
      try {
        await attendanceAPI.approve(id);
        showSuccess('Attendance approved');
        setSelected((current) => current.filter((item) => item !== id));
        await loadApprovals();
      } catch (error) {
        showError(error.response?.data?.message || 'Failed to approve attendance');
      }
    });
  };

  const rejectOne = async () => {
    if (!rejecting) return;
    if (!window.confirm(`Reject ${rejecting.employeeName}'s attendance for ${rejecting.attendanceDate}?`)) return;
    await run(async () => {
      try {
        await attendanceAPI.reject(rejecting.id, reason);
        showSuccess('Attendance rejected');
        setRejecting(null);
        setReason('');
        setSelected((current) => current.filter((item) => item !== rejecting.id));
        await loadApprovals();
      } catch (error) {
        showError(error.response?.data?.message || 'Failed to reject attendance');
      }
    });
  };

  const approveSelected = async () => {
    if (!selected.length) return;
    if (!window.confirm(`Approve ${selected.length} attendance record(s)?`)) return;
    await run(async () => {
      try {
        await Promise.all(selected.map((id) => attendanceAPI.approve(id)));
        showSuccess('Selected attendance approved');
        setSelected([]);
        await loadApprovals();
      } catch (error) {
        showError(error.response?.data?.message || 'Failed to bulk approve attendance');
      }
    });
  };

  if (loading) return <div className="page-shell text-center">Loading attendance approvals...</div>;

  return (
    <div className="page-shell">
      <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="section-eyebrow">HR Approval</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Attendance Approvals</h1>
          <p className="mt-2 text-sm text-slate-500">Review submitted check-ins and check-outs before they become final.</p>
        </div>
        <button type="button" onClick={approveSelected} disabled={acting || selected.length === 0} className="btn btn-primary">
          {acting ? <span className="btn-spinner" /> : null}
          Bulk Approve ({selected.length})
        </button>
      </div>

      <div className="card mb-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <input className="input-field" type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} />
          <select className="input-field" value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })}>
            <option value="">All departments</option>
            {departments.map((department) => <option key={department} value={department}>{department}</option>)}
          </select>
          <select className="input-field" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All statuses</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      <div className="card">
        {visibleRecords.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No attendance records match these filters</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-cell">Select</th>
                  <th className="table-cell">Employee</th>
                  <th className="table-cell">Department</th>
                  <th className="table-cell">Date</th>
                  <th className="table-cell">Check-in</th>
                  <th className="table-cell">Check-out</th>
                  <th className="table-cell">Status</th>
                  <th className="table-cell">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleRecords.map((record) => (
                  <tr key={record.id} className="table-row">
                    <td className="table-cell">
                      <input
                        type="checkbox"
                        checked={selected.includes(record.id)}
                        disabled={record.status !== 'PENDING_APPROVAL'}
                        onChange={() => toggleSelected(record.id)}
                      />
                    </td>
                    <td className="table-cell font-semibold">{record.employeeName}</td>
                    <td className="table-cell">{record.departmentName || '-'}</td>
                    <td className="table-cell">{record.attendanceDate}</td>
                    <td className="table-cell">{formatTime(record.checkInTime)}</td>
                    <td className="table-cell">{formatTime(record.checkOutTime)}</td>
                    <td className="table-cell"><span className={`badge ${badgeClass(record.status)}`}>{labelForStatus(record.status)}</span></td>
                    <td className="table-cell">
                      {record.status === 'PENDING_APPROVAL' ? (
                        <div className="flex gap-2">
                          <button type="button" disabled={acting} onClick={() => approveOne(record.id)} className="btn btn-primary">Approve</button>
                          <button type="button" disabled={acting} onClick={() => setRejecting(record)} className="btn btn-danger">Reject</button>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500">{record.approvedByName || '-'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {rejecting && (
        <div className="modal">
          <div className="modal-content p-6">
            <h2 className="text-xl font-bold text-slate-950">Reject attendance</h2>
            <p className="mt-2 text-sm text-slate-500">{rejecting.employeeName} on {rejecting.attendanceDate}</p>
            <textarea
              className="input-field mt-4 min-h-[120px]"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for rejection"
              autoFocus
            />
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="btn btn-secondary" onClick={() => { setRejecting(null); setReason(''); }}>Cancel</button>
              <button type="button" className="btn btn-danger" disabled={acting} onClick={rejectOne}>
                {acting ? <span className="btn-spinner" /> : null}
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const formatTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const labelForStatus = (status) => ({
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  PRESENT: 'Approved',
}[status] || status || 'Not Marked');

const badgeClass = (status) => ({
  APPROVED: 'badge-success',
  PRESENT: 'badge-success',
  PENDING_APPROVAL: 'badge-warning',
  REJECTED: 'badge-danger',
}[status] || 'badge-warning');

export default AttendanceApprovalsPage;
