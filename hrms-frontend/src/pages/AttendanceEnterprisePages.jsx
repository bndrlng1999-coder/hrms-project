import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { attendanceAPI, attendanceReportAPI, holidayAPI, shiftAPI } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import { useSingleFlight } from '../hooks/useSingleFlight';

const tabs = [
  ['/attendance', 'Today'],
  ['/attendance/calendar', 'Calendar'],
  ['/attendance/history', 'History'],
  ['/attendance/approvals', 'Approvals'],
  ['/attendance/regularization', 'Regularization'],
  ['/attendance/shifts', 'Shifts'],
  ['/attendance/holidays', 'Holidays'],
  ['/attendance/reports', 'Reports'],
];

export const AttendanceCalendarPage = () => {
  const [rows, setRows] = useState([]);
  const [period, setPeriod] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
  const { showError } = useNotification();

  useEffect(() => {
    attendanceAPI.myCalendar(period)
      .then((res) => setRows(res.data.data || []))
      .catch(() => showError('Failed to load attendance calendar'));
  }, [period.year, period.month]);

  return (
    <AttendanceShell title="Attendance Calendar">
      <div className="card mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <input className="input-field" type="number" value={period.year} onChange={(e) => setPeriod({ ...period, year: Number(e.target.value) })} />
        <select className="input-field" value={period.month} onChange={(e) => setPeriod({ ...period, month: Number(e.target.value) })}>
          {Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}
        </select>
      </div>
      <CalendarGrid rows={rows} year={period.year} month={period.month} />
    </AttendanceShell>
  );
};

export const AttendanceHistoryPage = () => {
  const [rows, setRows] = useState([]);
  const { showError } = useNotification();

  useEffect(() => {
    attendanceAPI.myHistory()
      .then((res) => setRows(res.data.data || []))
      .catch(() => showError('Failed to load attendance history'));
  }, []);

  return (
    <AttendanceShell title="Attendance History">
      <AttendanceTable rows={rows} />
    </AttendanceShell>
  );
};

export const AttendanceRegularizationPage = () => {
  const [history, setHistory] = useState([]);
  const [pending, setPending] = useState([]);
  const [form, setForm] = useState({ attendanceId: '', reason: '', requestedCheckIn: '', requestedCheckOut: '' });
  const { loading, run } = useSingleFlight();
  const { showError, showSuccess } = useNotification();

  const load = async () => {
    const [historyRes, pendingRes] = await Promise.all([
      attendanceAPI.myHistory(),
      attendanceAPI.getPendingRegularizations().catch(() => ({ data: { data: [] } })),
    ]);
    setHistory(historyRes.data.data || []);
    setPending(pendingRes.data.data || []);
  };

  useEffect(() => {
    load().catch(() => showError('Failed to load regularizations'));
  }, []);

  const submit = (e) => {
    e.preventDefault();
    run(async () => {
      await attendanceAPI.regularize(form.attendanceId, {
        reason: form.reason,
        requestedCheckIn: form.requestedCheckIn,
        requestedCheckOut: form.requestedCheckOut,
      });
      showSuccess('Regularization requested');
      setForm({ attendanceId: '', reason: '', requestedCheckIn: '', requestedCheckOut: '' });
      await load();
    }).catch(() => showError('Failed to request regularization'));
  };

  const decide = (id, approve) => run(async () => {
    if (approve) await attendanceAPI.approveRegularization(id);
    else await attendanceAPI.rejectRegularization(id, window.prompt('Reason for rejection') || 'Rejected');
    showSuccess(approve ? 'Regularization approved' : 'Regularization rejected');
    await load();
  }).catch(() => showError('Failed to update regularization'));

  return (
    <AttendanceShell title="Attendance Regularization">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 text-xl font-bold">Request Correction</h2>
          <form onSubmit={submit} className="space-y-4">
            <select className="input-field" value={form.attendanceId} onChange={(e) => setForm({ ...form, attendanceId: e.target.value })} required>
              <option value="">Select attendance record</option>
              {history.map((row) => <option key={row.id} value={row.id}>{row.attendanceDate} - {label(row.status)}</option>)}
            </select>
            <textarea className="input-field" placeholder="Reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required />
            <input className="input-field" type="datetime-local" value={form.requestedCheckIn} onChange={(e) => setForm({ ...form, requestedCheckIn: e.target.value })} />
            <input className="input-field" type="datetime-local" value={form.requestedCheckOut} onChange={(e) => setForm({ ...form, requestedCheckOut: e.target.value })} />
            <button className="btn btn-primary" disabled={loading}>{loading ? 'Submitting...' : 'Submit Request'}</button>
          </form>
        </div>
        <div className="card">
          <h2 className="mb-4 text-xl font-bold">Pending Regularizations</h2>
          <div className="space-y-3">
            {pending.length === 0 ? <Empty text="No pending regularizations" /> : pending.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 p-4">
                <p className="font-semibold">{item.employeeName} - {item.attendanceDate}</p>
                <p className="text-sm text-slate-500">{item.reason}</p>
                <div className="mt-3 flex gap-2">
                  <button className="btn btn-primary" onClick={() => decide(item.id, true)} disabled={loading}>Approve</button>
                  <button className="btn btn-danger" onClick={() => decide(item.id, false)} disabled={loading}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AttendanceShell>
  );
};

export const AttendanceShiftsPage = () => {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ name: 'General Shift', startTime: '09:00', endTime: '18:00', gracePeriodMinutes: '10', overtimeThresholdMinutes: '540', weekendRule: 'SATURDAY_SUNDAY' });
  const { loading, run } = useSingleFlight();
  const { showError, showSuccess } = useNotification();

  const load = () => shiftAPI.getAll().then((res) => setRows(res.data.data || []));
  useEffect(() => { load().catch(() => showError('Failed to load shifts')); }, []);

  const submit = (e) => {
    e.preventDefault();
    run(async () => {
      await shiftAPI.create({ ...form, halfDayThresholdMinutes: '240', fullDayMinimumMinutes: '480' });
      showSuccess('Shift saved');
      await load();
    }).catch(() => showError('Failed to save shift'));
  };

  return (
    <AttendanceShell title="Shift Management">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
        <div className="card">
          <h2 className="mb-4 text-xl font-bold">Create Shift</h2>
          <form onSubmit={submit} className="space-y-4">
            {['name', 'startTime', 'endTime', 'gracePeriodMinutes', 'overtimeThresholdMinutes', 'weekendRule'].map((field) => (
              <input key={field} className="input-field" placeholder={field} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} required />
            ))}
            <button className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Shift'}</button>
          </form>
        </div>
        <div className="card overflow-x-auto">
          <table className="table">
            <thead className="table-header"><tr><th className="table-cell">Name</th><th className="table-cell">Start</th><th className="table-cell">End</th><th className="table-cell">Grace</th><th className="table-cell">Weekend</th></tr></thead>
            <tbody>{rows.map((row) => <tr key={row.id} className="table-row"><td className="table-cell">{row.name}</td><td className="table-cell">{row.startTime}</td><td className="table-cell">{row.endTime}</td><td className="table-cell">{row.gracePeriodMinutes} min</td><td className="table-cell">{row.weekendRule}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </AttendanceShell>
  );
};

export const AttendanceHolidaysPage = () => {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ name: '', holidayDate: '' });
  const { loading, run } = useSingleFlight();
  const { showError, showSuccess } = useNotification();
  const load = () => holidayAPI.getAll().then((res) => setRows(res.data.data || []));
  useEffect(() => { load().catch(() => showError('Failed to load holidays')); }, []);

  const submit = (e) => {
    e.preventDefault();
    run(async () => {
      await holidayAPI.create(form);
      showSuccess('Holiday added');
      setForm({ name: '', holidayDate: '' });
      await load();
    }).catch(() => showError('Failed to add holiday'));
  };

  return (
    <AttendanceShell title="Holiday Management">
      <div className="card mb-6">
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px_auto]">
          <input className="input-field" placeholder="Holiday name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="input-field" type="date" value={form.holidayDate} onChange={(e) => setForm({ ...form, holidayDate: e.target.value })} required />
          <button className="btn btn-primary" disabled={loading}>{loading ? 'Adding...' : 'Add Holiday'}</button>
        </form>
      </div>
      <div className="card">
        {rows.length === 0 ? <Empty text="No holidays configured" /> : rows.map((row) => <div key={row.id} className="flex justify-between border-b border-slate-100 py-3"><span>{row.name}</span><span>{row.holidayDate}</span></div>)}
      </div>
    </AttendanceShell>
  );
};

export const AttendanceReportsPage = () => {
  const [report, setReport] = useState(null);
  const [period, setPeriod] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
  const { showError } = useNotification();
  useEffect(() => {
    attendanceReportAPI.monthly(period).then((res) => setReport(res.data.data)).catch(() => showError('Failed to load attendance report'));
  }, [period.year, period.month]);

  return (
    <AttendanceShell title="Attendance Reports">
      <div className="card mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <input className="input-field" type="number" value={period.year} onChange={(e) => setPeriod({ ...period, year: Number(e.target.value) })} />
        <input className="input-field" type="number" min="1" max="12" value={period.month} onChange={(e) => setPeriod({ ...period, month: Number(e.target.value) })} />
      </div>
      {!report ? <Empty text="Report not loaded" /> : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Metric label="Records" value={report.totalRecords} />
            <Metric label="Work Hours" value={(report.workMinutes / 60).toFixed(1)} />
            <Metric label="Overtime Hours" value={(report.overtimeMinutes / 60).toFixed(1)} />
          </div>
          <AttendanceTable rows={report.records || []} />
        </>
      )}
    </AttendanceShell>
  );
};

export const AttendanceShell = ({ title, children }) => (
  <div className="page-shell">
    <div className="mb-6">
      <p className="section-eyebrow">Enterprise Attendance</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-950">{title}</h1>
    </div>
    <div className="mb-6 flex flex-wrap gap-2">
      {tabs.map(([path, text]) => <Link key={path} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-primary-300 hover:text-primary-700" to={path}>{text}</Link>)}
    </div>
    {children}
  </div>
);

const CalendarGrid = ({ rows, year, month }) => {
  const rowByDate = useMemo(() => new Map(rows.map((row) => [row.attendanceDate, row])), [rows]);
  const days = new Date(year, month, 0).getDate();
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
      {Array.from({ length: days }, (_, index) => {
        const date = `${year}-${String(month).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`;
        const row = rowByDate.get(date);
        return <div key={date} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><p className="font-bold">{index + 1}</p><span className={`badge mt-3 ${badge(row?.status)}`}>{label(row?.status || 'NOT_MARKED')}</span></div>;
      })}
    </div>
  );
};

const AttendanceTable = ({ rows }) => (
  <div className="card overflow-x-auto">
    {rows.length === 0 ? <Empty text="No attendance records found" /> : (
      <table className="table">
        <thead className="table-header"><tr><th className="table-cell">Date</th><th className="table-cell">Employee</th><th className="table-cell">Status</th><th className="table-cell">Check-in</th><th className="table-cell">Check-out</th><th className="table-cell">Late</th><th className="table-cell">Early</th><th className="table-cell">OT</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row.id} className="table-row"><td className="table-cell">{row.attendanceDate}</td><td className="table-cell">{row.employeeName}</td><td className="table-cell"><span className={`badge ${badge(row.status)}`}>{label(row.status)}</span></td><td className="table-cell">{time(row.checkInTime)}</td><td className="table-cell">{time(row.checkOutTime)}</td><td className="table-cell">{row.lateMinutes || 0}m</td><td className="table-cell">{row.earlyLogoutMinutes || 0}m</td><td className="table-cell">{row.overtimeMinutes || 0}m</td></tr>)}</tbody>
      </table>
    )}
  </div>
);

const Metric = ({ label, value }) => <div className="metric-card"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-950">{value}</p></div>;
const Empty = ({ text }) => <div className="py-10 text-center text-slate-500">{text}</div>;
const time = (value) => value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';
const label = (status) => String(status || 'NOT_MARKED').replaceAll('_', ' ');
const badge = (status) => ({ APPROVED: 'badge-success', PRESENT: 'badge-success', PENDING_APPROVAL: 'badge-warning', REJECTED: 'badge-danger', LATE: 'badge-warning', HALF_DAY: 'badge-warning', HOLIDAY: 'badge-success', WEEK_OFF: 'badge-success', ON_LEAVE: 'badge-warning' }[status] || 'badge-warning');
