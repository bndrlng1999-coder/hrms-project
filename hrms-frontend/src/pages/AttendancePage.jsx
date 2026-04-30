import React, { useEffect, useMemo, useState } from 'react';
import { attendanceAPI, employeeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../hooks/useNotification';
import { useSingleFlight } from '../hooks/useSingleFlight';

const todayIso = () => new Date().toISOString().slice(0, 10);

const AttendancePage = () => {
  const [attendance, setAttendance] = useState([]);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const { loading: marking, run: runMark } = useSingleFlight();
  const { user } = useAuth();
  const { showError, showSuccess, showInfo } = useNotification();

  useEffect(() => {
    if (user?.id) {
      fetchAttendance();
    }
  }, [user]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const employeeRes = await employeeAPI.getByUserId(user.id);
      const currentEmployee = employeeRes.data.data;
      setEmployee(currentEmployee);

      const res = user.role === 'EMPLOYEE'
        ? await attendanceAPI.getByEmployee(currentEmployee.id)
        : await attendanceAPI.getAll();
      setAttendance(res.data.data || []);
    } catch (error) {
      showError('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  const todayRecord = useMemo(() => {
    if (!employee?.id) return null;
    return attendance.find((att) => att.employeeId === employee.id && att.attendanceDate === todayIso());
  }, [attendance, employee]);

  const handleAttendanceAction = async (action) => {
    if (!employee?.id) {
      showError('Employee profile not found');
      return;
    }
    if (action === 'check-in' && todayRecord?.checkInTime) {
      showInfo('You are already checked in for today');
      return;
    }
    if (action === 'check-out' && !todayRecord?.checkInTime) {
      showError('Check in before checking out');
      return;
    }
    if (action === 'check-out' && todayRecord?.checkOutTime) {
      showInfo('You are already checked out for today');
      return;
    }

    await runMark(async () => {
      try {
        if (action === 'check-in') {
          await attendanceAPI.checkIn();
        } else {
          await attendanceAPI.checkOut();
        }
        showSuccess(action === 'check-in' ? 'Check-in submitted for HR approval' : 'Check-out submitted for HR approval');
        await fetchAttendance();
      } catch (error) {
        showError(error.response?.data?.message || 'Failed to update attendance');
      }
    });
  };

  const checkedIn = Boolean(todayRecord?.checkInTime);
  const checkedOut = Boolean(todayRecord?.checkOutTime);
  const waitingApproval = todayRecord?.status === 'PENDING_APPROVAL';

  if (loading) return <div className="page-shell text-center">Loading attendance...</div>;

  return (
    <div className="page-shell">
      <div className="mb-8">
        <p className="section-eyebrow">Attendance</p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">Daily Attendance</h1>
            <p className="mt-2 text-sm text-slate-500">
              {waitingApproval ? 'Waiting for HR approval' : 'Your approved attendance is considered final.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleAttendanceAction('check-in')}
              disabled={marking || checkedIn}
              className="btn btn-primary min-w-[140px]"
            >
              {marking && !checkedIn ? <span className="btn-spinner" /> : null}
              {checkedIn ? 'Checked In' : 'Check In'}
            </button>
            <button
              type="button"
              onClick={() => handleAttendanceAction('check-out')}
              disabled={marking || !checkedIn || checkedOut}
              className="btn btn-secondary min-w-[140px]"
            >
              {marking && checkedIn && !checkedOut ? <span className="btn-spinner" /> : null}
              {checkedOut ? 'Checked Out' : 'Check Out'}
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatusCard label="Today" value={todayIso()} tone="neutral" />
        <StatusCard label="Check-in" value={formatTime(todayRecord?.checkInTime)} tone={checkedIn ? 'success' : 'warning'} />
        <StatusCard label="Check-out" value={formatTime(todayRecord?.checkOutTime)} tone={checkedOut ? 'success' : 'warning'} />
        <StatusCard label="Approval" value={labelForStatus(todayRecord?.status || 'NOT_MARKED')} tone={toneForStatus(todayRecord?.status)} />
      </div>

      <div className="card">
        {attendance.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No attendance records found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-cell">Employee</th>
                  <th className="table-cell">Date</th>
                  <th className="table-cell">Status</th>
                  <th className="table-cell">Check-in</th>
                  <th className="table-cell">Check-out</th>
                  <th className="table-cell">Notes</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((att) => (
                  <tr key={att.id} className="table-row">
                    <td className="table-cell">{att.employeeName}</td>
                    <td className="table-cell">{att.attendanceDate}</td>
                    <td className="table-cell">
                      <span className={`badge ${badgeClass(att.status)}`}>{labelForStatus(att.status)}</span>
                    </td>
                    <td className="table-cell">{formatTime(att.checkInTime)}</td>
                    <td className="table-cell">{formatTime(att.checkOutTime)}</td>
                    <td className="table-cell">{att.rejectionReason || (att.status === 'PENDING_APPROVAL' ? 'Waiting for HR approval' : '-')}</td>
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

const StatusCard = ({ label, value, tone }) => (
  <div className="metric-card">
    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
    <p className={`mt-2 text-lg font-bold ${toneClass(tone)}`}>{value || '-'}</p>
  </div>
);

const formatTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const labelForStatus = (status) => ({
  NOT_MARKED: 'Not Marked',
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

const toneForStatus = (status) => ({
  APPROVED: 'success',
  PRESENT: 'success',
  PENDING_APPROVAL: 'warning',
  REJECTED: 'danger',
}[status] || 'neutral');

const toneClass = (tone) => ({
  success: 'text-emerald-700',
  warning: 'text-amber-700',
  danger: 'text-red-700',
  neutral: 'text-slate-900',
}[tone] || 'text-slate-900');

export default AttendancePage;
