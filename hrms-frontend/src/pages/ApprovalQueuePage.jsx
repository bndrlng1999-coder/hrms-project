import React, { useEffect, useState } from 'react';
import { approvalAPI } from '../services/api';
import { useNotification } from '../hooks/useNotification';

const ApprovalQueuePage = () => {
  const [items, setItems] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [selected, setSelected] = useState(null);
  const [remarks, setRemarks] = useState('');
  const { showError, showSuccess } = useNotification();

  const load = async () => {
    try {
      const res = await approvalAPI.queue();
      setItems(res.data.data || []);
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to load approval queue');
    }
  };

  useEffect(() => { load(); }, []);

  const openTimeline = async (item) => {
    setSelected(item);
    const res = await approvalAPI.timeline(item.id);
    setTimeline(res.data.data || []);
  };

  const decide = async (approve) => {
    try {
      if (approve) await approvalAPI.approve(selected.id, remarks);
      else await approvalAPI.reject(selected.id, remarks);
      showSuccess(approve ? 'Approved' : 'Rejected');
      setSelected(null);
      setTimeline([]);
      setRemarks('');
      load();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to update approval');
    }
  };

  return (
    <div className="page-shell">
      <p className="section-eyebrow">Workflow</p>
      <h1 className="mb-6 text-3xl font-bold text-slate-950">Approval Queue</h1>
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="card overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr><th className="table-cell">Module</th><th className="table-cell">Summary</th><th className="table-cell">Level</th><th className="table-cell">Status</th><th className="table-cell">Action</th></tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="table-row">
                  <td className="table-cell font-semibold">{item.module}</td>
                  <td className="table-cell">{item.summary || `Entity #${item.entityId}`}</td>
                  <td className="table-cell">{item.level}</td>
                  <td className="table-cell"><span className="badge badge-warning">{item.status}</span></td>
                  <td className="table-cell"><button className="btn btn-secondary" onClick={() => openTimeline(item)}>Review</button></td>
                </tr>
              ))}
              {!items.length && <tr><td className="table-cell text-slate-500" colSpan="5">No pending approvals</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Timeline</h2>
          {selected ? (
            <>
              <div className="mb-4 space-y-2">
                {timeline.map((row, index) => (
                  <div key={`${row.type}-${index}`} className="rounded-md border border-slate-200 p-3 text-sm">
                    <div className="font-semibold">{row.type} L{row.level} · {row.approverRole}</div>
                    <div className="text-slate-500">{row.status} {row.approvedBy ? `by ${row.approvedBy}` : ''}</div>
                    {row.remarks && <div className="mt-1 text-slate-700">{row.remarks}</div>}
                  </div>
                ))}
              </div>
              <textarea className="input-field mb-3 min-h-24" placeholder="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
              <div className="flex gap-2">
                <button className="btn btn-primary" onClick={() => decide(true)}>Approve</button>
                <button className="btn btn-danger" onClick={() => decide(false)}>Reject</button>
              </div>
            </>
          ) : <p className="text-sm text-slate-500">Select an approval to review its steps.</p>}
        </div>
      </div>
    </div>
  );
};

export default ApprovalQueuePage;
