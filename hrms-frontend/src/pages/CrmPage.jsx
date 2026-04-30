import React, { useEffect, useMemo, useState } from 'react';
import { crmAPI, employeeAPI } from '../services/api';
import { useNotification } from '../hooks/useNotification';

const leadStatuses = ['NEW', 'CONTACTED', 'FOLLOW_UP', 'PROPOSAL', 'NEGOTIATION', 'CONVERTED', 'LOST'];

const CrmPage = () => {
  const [leads, setLeads] = useState([]);
  const [clients, setClients] = useState([]);
  const [deals, setDeals] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [report, setReport] = useState(null);
  const [leadForm, setLeadForm] = useState({ name: '', company: '', email: '', phone: '', assignedToId: '', notes: '' });
  const [dealForm, setDealForm] = useState({ title: '', leadId: '', clientId: '', value: '', expectedCloseDate: '' });
  const [filter, setFilter] = useState('');
  const { showError, showSuccess } = useNotification();

  const load = async () => {
    try {
      const [leadRes, clientRes, dealRes, employeeRes, reportRes] = await Promise.all([
        crmAPI.getLeads(),
        crmAPI.getClients(),
        crmAPI.getDeals(),
        employeeAPI.getAll(),
        crmAPI.slaReport(),
      ]);
      setLeads(leadRes.data.data || []);
      setClients(clientRes.data.data || []);
      setDeals(dealRes.data.data || []);
      setEmployees(employeeRes.data.data || []);
      setReport(reportRes.data.data || null);
      const firstEmployee = employeeRes.data.data?.[0]?.id || '';
      setLeadForm((current) => ({ ...current, assignedToId: current.assignedToId || firstEmployee }));
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to load CRM');
    }
  };

  useEffect(() => { load(); }, []);

  const filteredLeads = useMemo(() => leads.filter((lead) => !filter || lead.status === filter), [leads, filter]);

  const createLead = async (e) => {
    e.preventDefault();
    try {
      await crmAPI.createLead({ ...leadForm, assignedToId: Number(leadForm.assignedToId) });
      showSuccess('Lead created');
      setLeadForm({ name: '', company: '', email: '', phone: '', assignedToId: employees[0]?.id || '', notes: '' });
      load();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to create lead');
    }
  };

  const updateLeadStatus = async (lead, status) => {
    try {
      await crmAPI.updateLead(lead.id, { ...lead, status });
      showSuccess('Lead updated');
      load();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to update lead');
    }
  };

  const createDeal = async (e) => {
    e.preventDefault();
    try {
      await crmAPI.createDeal({
        ...dealForm,
        leadId: dealForm.leadId ? Number(dealForm.leadId) : null,
        clientId: dealForm.clientId ? Number(dealForm.clientId) : null,
        value: dealForm.value || 0,
      });
      showSuccess('Deal created');
      setDealForm({ title: '', leadId: '', clientId: '', value: '', expectedCloseDate: '' });
      load();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to create deal');
    }
  };

  return (
    <div className="page-shell">
      <p className="section-eyebrow">CRM</p>
      <h1 className="mb-6 text-3xl font-bold text-slate-950">Leads, Deals and SLA</h1>

      <div className="mb-6 grid gap-4 lg:grid-cols-4">
        <Metric label="Leads" value={report?.totalLeads ?? leads.length} />
        <Metric label="Contacted" value={report?.contactedLeads ?? 0} />
        <Metric label="Breached SLA" value={report?.slaByStatus?.BREACHED ?? 0} tone="danger" />
        <Metric label="Avg response min" value={report?.averageResponseMinutes ?? 0} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div className="card">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900">Leads</h2>
              <select className="input-field max-w-xs" value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="">All statuses</option>
                {leadStatuses.map((status) => <option key={status}>{status}</option>)}
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr><th className="table-cell">Lead</th><th className="table-cell">Status</th><th className="table-cell">SLA</th><th className="table-cell">Due</th><th className="table-cell">Owner</th></tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="table-row">
                      <td className="table-cell"><div className="font-semibold">{lead.name}</div><div className="text-xs text-slate-500">{lead.company || lead.email}</div></td>
                      <td className="table-cell">
                        <select className="input-field min-w-40" value={lead.status} onChange={(e) => updateLeadStatus(lead, e.target.value)}>
                          {leadStatuses.map((status) => <option key={status}>{status}</option>)}
                        </select>
                      </td>
                      <td className="table-cell"><SlaBadge value={lead.slaStatus} /></td>
                      <td className="table-cell text-sm">{lead.slaDueTime ? new Date(lead.slaDueTime).toLocaleString() : '-'}</td>
                      <td className="table-cell">{lead.assignedToName || '-'}</td>
                    </tr>
                  ))}
                  {!filteredLeads.length && <tr><td className="table-cell text-slate-500" colSpan="5">No leads found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card overflow-x-auto">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Deals</h2>
            <table className="table">
              <thead className="table-header"><tr><th className="table-cell">Deal</th><th className="table-cell">Value</th><th className="table-cell">Status</th><th className="table-cell">Owner</th></tr></thead>
              <tbody>
                {deals.map((deal) => (
                  <tr key={deal.id} className="table-row"><td className="table-cell font-semibold">{deal.title}</td><td className="table-cell">{deal.value}</td><td className="table-cell"><span className="badge badge-warning">{deal.status}</span></td><td className="table-cell">{deal.ownerName}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <form className="card space-y-3" onSubmit={createLead}>
            <h2 className="text-lg font-bold text-slate-900">New Lead</h2>
            <input className="input-field" placeholder="Lead name" value={leadForm.name} onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })} required />
            <input className="input-field" placeholder="Company" value={leadForm.company} onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })} />
            <input className="input-field" placeholder="Email" value={leadForm.email} onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })} />
            <input className="input-field" placeholder="Phone" value={leadForm.phone} onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })} />
            <select className="input-field" value={leadForm.assignedToId} onChange={(e) => setLeadForm({ ...leadForm, assignedToId: e.target.value })}>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.firstName} {employee.lastName}</option>)}</select>
            <textarea className="input-field min-h-24" placeholder="Notes" value={leadForm.notes} onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })} />
            <button className="btn btn-primary w-full">Create lead</button>
          </form>

          <form className="card space-y-3" onSubmit={createDeal}>
            <h2 className="text-lg font-bold text-slate-900">New Deal</h2>
            <input className="input-field" placeholder="Deal title" value={dealForm.title} onChange={(e) => setDealForm({ ...dealForm, title: e.target.value })} required />
            <select className="input-field" value={dealForm.leadId} onChange={(e) => setDealForm({ ...dealForm, leadId: e.target.value })}><option value="">No lead</option>{leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.name}</option>)}</select>
            <select className="input-field" value={dealForm.clientId} onChange={(e) => setDealForm({ ...dealForm, clientId: e.target.value })}><option value="">No client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select>
            <input className="input-field" placeholder="Value" value={dealForm.value} onChange={(e) => setDealForm({ ...dealForm, value: e.target.value })} />
            <input className="input-field" type="date" value={dealForm.expectedCloseDate} onChange={(e) => setDealForm({ ...dealForm, expectedCloseDate: e.target.value })} />
            <button className="btn btn-primary w-full">Create deal</button>
          </form>
        </div>
      </div>
    </div>
  );
};

const Metric = ({ label, value, tone }) => (
  <div className="card">
    <div className="text-xs font-bold uppercase text-slate-500">{label}</div>
    <div className={`mt-2 text-2xl font-black ${tone === 'danger' ? 'text-red-600' : 'text-slate-950'}`}>{value}</div>
  </div>
);

const SlaBadge = ({ value }) => {
  const classes = value === 'BREACHED' ? 'badge-danger' : value === 'AT_RISK' ? 'badge-warning' : 'badge-success';
  return <span className={`badge ${classes}`}>{value}</span>;
};

export default CrmPage;
