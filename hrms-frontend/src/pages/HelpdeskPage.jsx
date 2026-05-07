import React, { useEffect, useState } from 'react';
import { helpdeskAPI } from '../services/api';
import { PERMISSIONS, hasPermission } from '../auth/authorization';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../hooks/useNotification';

const HelpdeskPage = () => {
  const [tickets, setTickets] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('IN_PROGRESS');
  const [formData, setFormData] = useState({
    title: '',
    category: 'PAYROLL',
    description: '',
  });
  const { user } = useAuth();
  const { showError, showSuccess } = useNotification();
  const canReply = hasPermission(user, [PERMISSIONS.HELPDESK_REPLY, PERMISSIONS.HELPDESK_MANAGE]);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await helpdeskAPI.getTickets();
      setTickets(res.data.data?.tickets || []);
    } catch (error) {
      showError('Failed to load tickets');
    }
  };

  const submitReply = async (ticket) => {
    if (!replyText.trim() || submitting) return;
    try {
      setSubmitting(true);
      const res = await helpdeskAPI.reply(ticket.id, { reply: replyText, status: replyStatus });
      setTickets((current) => current.map((item) => item.id === ticket.id ? res.data.data : item));
      setReplyingId(null);
      setReplyText('');
      setReplyStatus('IN_PROGRESS');
      showSuccess('Reply sent');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to reply to ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    try {
      setSubmitting(true);
      const res = await helpdeskAPI.createTicket(formData);
      setTickets((current) => [res.data.data, ...current]);
      setFormData({ title: '', category: 'PAYROLL', description: '' });
      showSuccess('Ticket created');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="mb-8 flex flex-col gap-2">
        <p className="section-eyebrow">Support Operations</p>
        <h1 className="text-3xl font-bold text-slate-950">Helpdesk</h1>
        <p className="text-sm text-slate-500">Create, track, reply, and resolve internal support tickets.</p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatusMetric label="Open" value={tickets.filter((ticket) => ticket.status === 'OPEN').length} />
        <StatusMetric label="In progress" value={tickets.filter((ticket) => ticket.status === 'IN_PROGRESS').length} />
        <StatusMetric label="Resolved" value={tickets.filter((ticket) => ticket.status === 'RESOLVED').length} />
      </div>

      <div className="card">
        <h2 className="text-xl font-bold mb-4">Create Ticket</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field"
              placeholder="Issue title"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="input-field"
            >
              <option>PAYROLL</option>
              <option>ATTENDANCE</option>
              <option>LEAVE</option>
              <option>DOCUMENTS</option>
              <option>GENERAL</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field"
              rows="4"
              placeholder="Describe your issue"
            />
          </div>
          <button type="submit" disabled={submitting} className="btn btn-primary disabled:opacity-50">
            {submitting ? 'Creating...' : 'Create Ticket'}
          </button>
        </form>
      </div>

      <div className="card mt-8">
        <h2 className="text-xl font-bold mb-4">Your Tickets</h2>
        {tickets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No tickets yet</div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div key={ticket.id || ticket.ticketNumber} className="rounded-lg border border-slate-200 p-4 transition hover:border-primary-200 hover:bg-primary-50/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{ticket.title}</h3>
                    <p className="text-sm text-gray-500">{ticket.ticketNumber} - {ticket.category}</p>
                  </div>
                  <span className={`badge ${statusBadge(ticket.status)}`}>{String(ticket.status).replaceAll('_', ' ')}</span>
                </div>
                <p className="mt-3 text-sm text-slate-600">{ticket.description || 'No description provided.'}</p>
                {ticket.resolutionNotes && <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-600">{ticket.resolutionNotes}</p>}
                {canReply && (
                  <div className="mt-4">
                    {replyingId === ticket.id ? (
                      <div className="space-y-3">
                        <textarea
                          className="input-field min-h-[90px]"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write a reply"
                        />
                        <select className="input-field max-w-xs" value={replyStatus} onChange={(e) => setReplyStatus(e.target.value)}>
                          <option value="IN_PROGRESS">In progress</option>
                          <option value="RESOLVED">Resolved</option>
                          <option value="OPEN">Reopen</option>
                        </select>
                        <div className="flex gap-2">
                          <button type="button" className="btn btn-primary" disabled={submitting || !replyText.trim()} onClick={() => submitReply(ticket)}>
                            {submitting ? <span className="btn-spinner" /> : null}
                            Send Reply
                          </button>
                          <button type="button" className="btn btn-secondary" onClick={() => { setReplyingId(null); setReplyText(''); setReplyStatus('IN_PROGRESS'); }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" className="btn btn-secondary" onClick={() => setReplyingId(ticket.id)}>
                        Reply
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StatusMetric = ({ label, value }) => (
  <div className="metric-card">
    <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
  </div>
);

const statusBadge = (status) => ({
  OPEN: 'badge-warning',
  IN_PROGRESS: 'badge-warning',
  RESOLVED: 'badge-success',
}[status] || 'badge-warning');

export default HelpdeskPage;
