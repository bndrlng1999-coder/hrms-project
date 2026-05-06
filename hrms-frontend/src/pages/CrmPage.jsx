import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { crmAPI, employeeAPI } from '../services/api';
import { useNotification } from '../hooks/useNotification';

const leadStatuses = ['NEW', 'CONTACTED', 'FOLLOW_UP', 'PROPOSAL', 'NEGOTIATION', 'CONVERTED', 'LOST'];

const emptyLead = { name: '', company: '', email: '', phone: '', assignedToId: '', notes: '', status: 'NEW' };
const emptyClient = { name: '', company: '', email: '', phone: '' };
const emptyDeal = { title: '', leadId: '', clientId: '', value: '', expectedCloseDate: '' };

const CrmPage = ({ view = 'dashboard' }) => {
  const [leads, setLeads] = useState([]);
  const [clients, setClients] = useState([]);
  const [deals, setDeals] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [report, setReport] = useState(null);
  const [leadForm, setLeadForm] = useState(emptyLead);
  const [clientForm, setClientForm] = useState(emptyClient);
  const [dealForm, setDealForm] = useState(emptyDeal);
  const [followUpForm, setFollowUpForm] = useState({ leadId: '', followUpAt: '', notes: '' });
  const [proposalForm, setProposalForm] = useState({ dealId: '', title: '', content: '' });
  const [filter, setFilter] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState('');
  const { showError, showSuccess } = useNotification();

  const load = async () => {
    try {
      setLoading(true);
      const [leadRes, clientRes, dealRes, employeeRes, reportRes] = await Promise.all([
        crmAPI.getLeads(),
        crmAPI.getClients(),
        crmAPI.getDeals(),
        employeeAPI.getAll(),
        crmAPI.slaReport(),
      ]);
      const nextLeads = leadRes.data.data || [];
      const nextClients = clientRes.data.data || [];
      const nextDeals = dealRes.data.data || [];
      const nextEmployees = employeeRes.data.data || [];
      setLeads(nextLeads);
      setClients(nextClients);
      setDeals(nextDeals);
      setEmployees(nextEmployees);
      setReport(reportRes.data.data || null);
      const firstEmployee = nextEmployees[0]?.id || '';
      const firstLead = nextLeads[0]?.id || '';
      const firstDeal = nextDeals[0]?.id || '';
      setLeadForm((current) => ({ ...current, assignedToId: current.assignedToId || firstEmployee }));
      setDealForm((current) => ({ ...current, leadId: current.leadId || firstLead, clientId: current.clientId || nextClients[0]?.id || '' }));
      setFollowUpForm((current) => ({ ...current, leadId: current.leadId || firstLead }));
      setProposalForm((current) => ({ ...current, dealId: current.dealId || firstDeal }));
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to load CRM');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredLeads = useMemo(() => leads
    .filter((lead) => !filter || lead.status === filter)
    .filter((lead) => match(lead, query, ['name', 'company', 'email', 'phone', 'assignedToName'])), [leads, filter, query]);
  const filteredClients = clients.filter((client) => match(client, query, ['name', 'company', 'email', 'phone', 'ownerName']));
  const filteredDeals = deals.filter((deal) => match(deal, query, ['title', 'status', 'leadName', 'clientName', 'ownerName']));

  const createLead = async (event) => {
    event.preventDefault();
    await submit('lead', async () => {
      await crmAPI.createLead({ ...leadForm, assignedToId: Number(leadForm.assignedToId) });
      setLeadForm({ ...emptyLead, assignedToId: employees[0]?.id || '' });
      showSuccess('Lead created');
    });
  };

  const updateLeadStatus = async (lead, status) => {
    await submit(`lead-${lead.id}`, async () => {
      await crmAPI.updateLead(lead.id, { ...lead, status });
      showSuccess('Lead updated');
    });
  };

  const createClient = async (event) => {
    event.preventDefault();
    await submit('client', async () => {
      await crmAPI.createClient(clientForm);
      setClientForm(emptyClient);
      showSuccess('Client created');
    });
  };

  const createDeal = async (event) => {
    event.preventDefault();
    await submit('deal', async () => {
      await crmAPI.createDeal({
        ...dealForm,
        leadId: dealForm.leadId ? Number(dealForm.leadId) : null,
        clientId: dealForm.clientId ? Number(dealForm.clientId) : null,
        value: dealForm.value || 0,
      });
      setDealForm(emptyDeal);
      showSuccess('Deal created');
    });
  };

  const createFollowUp = async (event) => {
    event.preventDefault();
    await submit('follow-up', async () => {
      await crmAPI.createFollowUp({
        ...followUpForm,
        leadId: Number(followUpForm.leadId),
        followUpAt: followUpForm.followUpAt || new Date().toISOString().slice(0, 16),
      });
      setFollowUpForm({ leadId: leads[0]?.id || '', followUpAt: '', notes: '' });
      showSuccess('Follow-up created');
    });
  };

  const createProposal = async (event) => {
    event.preventDefault();
    await submit('proposal', async () => {
      await crmAPI.createProposal({ ...proposalForm, dealId: Number(proposalForm.dealId) });
      setProposalForm({ dealId: deals[0]?.id || '', title: '', content: '' });
      showSuccess('Proposal created');
    });
  };

  const submit = async (key, action) => {
    if (submitting) return;
    try {
      setSubmitting(key);
      await action();
      await load();
    } catch (error) {
      showError(error.response?.data?.message || 'CRM action failed');
    } finally {
      setSubmitting('');
    }
  };

  const sections = {
    dashboard: <Dashboard report={report} leads={leads} deals={deals} clients={clients} />,
    leads: <LeadsSection leads={filteredLeads} employees={employees} filter={filter} setFilter={setFilter} form={leadForm} setForm={setLeadForm} onCreate={createLead} onStatus={updateLeadStatus} submitting={submitting} />,
    clients: <ClientsSection clients={filteredClients} form={clientForm} setForm={setClientForm} onCreate={createClient} submitting={submitting} />,
    deals: <DealsSection deals={filteredDeals} leads={leads} clients={clients} form={dealForm} setForm={setDealForm} onCreate={createDeal} submitting={submitting} />,
    followups: <FollowUpsSection leads={leads} form={followUpForm} setForm={setFollowUpForm} onCreate={createFollowUp} submitting={submitting} />,
    proposals: <ProposalsSection deals={deals} form={proposalForm} setForm={setProposalForm} onCreate={createProposal} submitting={submitting} />,
    sla: <SlaSection report={report} leads={filteredLeads} />,
    reports: <ReportsSection report={report} leads={leads} clients={clients} deals={deals} />,
  };

  return (
    <div className="page-shell">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="section-eyebrow">CRM</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">{titleFor(view)}</h1>
          <p className="mt-2 text-sm text-slate-500">Leads, clients, deals, follow-ups, proposals, and SLA visibility.</p>
        </div>
        {view !== 'dashboard' && <input className="input-field max-w-sm" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search CRM..." />}
      </div>
      <CrmTabs />
      {loading ? <div className="card">Loading CRM...</div> : sections[view] || sections.dashboard}
    </div>
  );
};

const CrmTabs = () => {
  const tabs = [
    ['/crm', 'Dashboard'],
    ['/crm/leads', 'Leads'],
    ['/crm/clients', 'Clients'],
    ['/crm/deals', 'Deals'],
    ['/crm/follow-ups', 'Follow-ups'],
    ['/crm/proposals', 'Proposals'],
    ['/crm/sla-tracking', 'SLA'],
    ['/crm/reports', 'Reports'],
  ];
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {tabs.map(([path, label]) => <Link key={path} to={path} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-primary-300 hover:text-primary-700">{label}</Link>)}
    </div>
  );
};

const Dashboard = ({ report, leads, deals, clients }) => (
  <div className="space-y-6">
    <div className="grid gap-4 lg:grid-cols-4">
      <Metric label="Leads" value={report?.totalLeads ?? leads.length} />
      <Metric label="Clients" value={clients.length} />
      <Metric label="Deals" value={deals.length} />
      <Metric label="Breached SLA" value={report?.slaByStatus?.BREACHED ?? 0} tone="danger" />
    </div>
    <LeadsTable leads={leads.slice(0, 8)} onStatus={() => {}} readOnly />
  </div>
);

const LeadsSection = ({ leads, employees, filter, setFilter, form, setForm, onCreate, onStatus, submitting }) => (
  <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
    <div>
      <div className="mb-3 flex justify-end">
        <select className="input-field max-w-xs" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All statuses</option>
          {leadStatuses.map((status) => <option key={status}>{status}</option>)}
        </select>
      </div>
      <LeadsTable leads={leads} onStatus={onStatus} />
    </div>
    <LeadForm form={form} setForm={setForm} employees={employees} onSubmit={onCreate} submitting={submitting === 'lead'} />
  </div>
);

const ClientsSection = ({ clients, form, setForm, onCreate, submitting }) => (
  <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
    <DataTable empty="No clients found" columns={['Client', 'Company', 'Email', 'Phone', 'Owner']} rows={clients.map((client) => [client.name, client.company || '-', client.email || '-', client.phone || '-', client.ownerName || '-'])} />
    <ClientForm form={form} setForm={setForm} onSubmit={onCreate} submitting={submitting === 'client'} />
  </div>
);

const DealsSection = ({ deals, leads, clients, form, setForm, onCreate, submitting }) => (
  <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
    <DataTable empty="No deals found" columns={['Deal', 'Value', 'Status', 'Lead', 'Client', 'Owner']} rows={deals.map((deal) => [deal.title, deal.value || 0, <Badge key="status" value={deal.status} />, deal.leadName || '-', deal.clientName || '-', deal.ownerName || '-'])} />
    <DealForm form={form} setForm={setForm} leads={leads} clients={clients} onSubmit={onCreate} submitting={submitting === 'deal'} />
  </div>
);

const FollowUpsSection = ({ leads, form, setForm, onCreate, submitting }) => (
  <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
    <DataTable empty="No leads need follow-up" columns={['Lead', 'Status', 'Next Follow-up', 'Owner', 'SLA']} rows={leads.filter((lead) => lead.nextFollowUpAt || lead.status === 'FOLLOW_UP').map((lead) => [lead.name, <Badge key="status" value={lead.status} />, formatDate(lead.nextFollowUpAt), lead.assignedToName || '-', <SlaBadge key="sla" value={lead.slaStatus} />])} />
    <FollowUpForm form={form} setForm={setForm} leads={leads} onSubmit={onCreate} submitting={submitting === 'follow-up'} />
  </div>
);

const ProposalsSection = ({ deals, form, setForm, onCreate, submitting }) => (
  <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
    <DataTable empty="No proposal-ready deals found" columns={['Deal', 'Value', 'Status', 'Client']} rows={deals.map((deal) => [deal.title, deal.value || 0, <Badge key="status" value={deal.status} />, deal.clientName || '-'])} />
    <ProposalForm form={form} setForm={setForm} deals={deals} onSubmit={onCreate} submitting={submitting === 'proposal'} />
  </div>
);

const SlaSection = ({ report, leads }) => (
  <div className="space-y-6">
    <div className="grid gap-4 lg:grid-cols-3">
      <Metric label="Contacted leads" value={report?.contactedLeads ?? 0} />
      <Metric label="Average response min" value={report?.averageResponseMinutes ?? 0} />
      <Metric label="Breached SLA" value={report?.slaByStatus?.BREACHED ?? 0} tone="danger" />
    </div>
    <DataTable empty="No SLA tracked leads found" columns={['Lead', 'Status', 'SLA', 'Due', 'Owner']} rows={leads.map((lead) => [lead.name, <Badge key="status" value={lead.status} />, <SlaBadge key="sla" value={lead.slaStatus} />, formatDate(lead.slaDueTime), lead.assignedToName || '-'])} />
  </div>
);

const ReportsSection = ({ report, leads, clients, deals }) => (
  <div className="grid gap-4 lg:grid-cols-4">
    <Metric label="Total leads" value={report?.totalLeads ?? leads.length} />
    <Metric label="Total clients" value={clients.length} />
    <Metric label="Total deals" value={deals.length} />
    <Metric label="At-risk SLA" value={report?.slaByStatus?.AT_RISK ?? 0} />
  </div>
);

const LeadsTable = ({ leads, onStatus, readOnly }) => (
  <DataTable
    empty="No leads found"
    columns={['Lead', 'Status', 'SLA', 'Due', 'Owner']}
    rows={leads.map((lead) => [
      <div key="lead"><div className="font-semibold">{lead.name}</div><div className="text-xs text-slate-500">{lead.company || lead.email}</div></div>,
      readOnly ? <Badge key="status" value={lead.status} /> : <select key="status" className="input-field min-w-40" value={lead.status} onChange={(e) => onStatus(lead, e.target.value)}>{leadStatuses.map((status) => <option key={status}>{status}</option>)}</select>,
      <SlaBadge key="sla" value={lead.slaStatus} />,
      formatDate(lead.slaDueTime),
      lead.assignedToName || '-',
    ])}
  />
);

const LeadForm = ({ form, setForm, employees, onSubmit, submitting }) => (
  <FormCard title="New Lead" onSubmit={onSubmit} submitting={submitting} submitLabel="Create lead">
    <input className="input-field" placeholder="Lead name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
    <input className="input-field" placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
    <input className="input-field" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
    <input className="input-field" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
    <select className="input-field" value={form.assignedToId} onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.firstName} {employee.lastName}</option>)}</select>
    <textarea className="input-field min-h-24" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
  </FormCard>
);

const ClientForm = ({ form, setForm, onSubmit, submitting }) => (
  <FormCard title="New Client" onSubmit={onSubmit} submitting={submitting} submitLabel="Create client">
    <input className="input-field" placeholder="Client name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
    <input className="input-field" placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
    <input className="input-field" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
    <input className="input-field" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
  </FormCard>
);

const DealForm = ({ form, setForm, leads, clients, onSubmit, submitting }) => (
  <FormCard title="New Deal" onSubmit={onSubmit} submitting={submitting} submitLabel="Create deal">
    <input className="input-field" placeholder="Deal title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
    <select className="input-field" value={form.leadId} onChange={(e) => setForm({ ...form, leadId: e.target.value })}><option value="">No lead</option>{leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.name}</option>)}</select>
    <select className="input-field" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}><option value="">No client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select>
    <input className="input-field" placeholder="Value" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
    <input className="input-field" type="date" value={form.expectedCloseDate} onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })} />
  </FormCard>
);

const FollowUpForm = ({ form, setForm, leads, onSubmit, submitting }) => (
  <FormCard title="Schedule Follow-up" onSubmit={onSubmit} submitting={submitting} submitLabel="Create follow-up">
    <select className="input-field" value={form.leadId} onChange={(e) => setForm({ ...form, leadId: e.target.value })} required>{leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.name}</option>)}</select>
    <input className="input-field" type="datetime-local" value={form.followUpAt} onChange={(e) => setForm({ ...form, followUpAt: e.target.value })} />
    <textarea className="input-field min-h-24" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
  </FormCard>
);

const ProposalForm = ({ form, setForm, deals, onSubmit, submitting }) => (
  <FormCard title="Create Proposal" onSubmit={onSubmit} submitting={submitting} submitLabel="Create proposal">
    <select className="input-field" value={form.dealId} onChange={(e) => setForm({ ...form, dealId: e.target.value })} required>{deals.map((deal) => <option key={deal.id} value={deal.id}>{deal.title}</option>)}</select>
    <input className="input-field" placeholder="Proposal title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
    <textarea className="input-field min-h-32" placeholder="Proposal content" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
  </FormCard>
);

const FormCard = ({ title, children, onSubmit, submitting, submitLabel }) => (
  <form className="card h-fit space-y-3" onSubmit={onSubmit}>
    <h2 className="text-lg font-bold text-slate-900">{title}</h2>
    {children}
    <button className="btn btn-primary w-full" disabled={submitting}>{submitting ? 'Saving...' : submitLabel}</button>
  </form>
);

const DataTable = ({ columns, rows, empty }) => (
  <div className="card overflow-x-auto">
    {rows.length === 0 ? <div className="py-10 text-center text-slate-500">{empty}</div> : (
      <table className="table">
        <thead className="table-header"><tr>{columns.map((column) => <th key={column} className="table-cell">{column}</th>)}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={index} className="table-row">{row.map((cell, cellIndex) => <td key={cellIndex} className="table-cell">{cell}</td>)}</tr>)}</tbody>
      </table>
    )}
  </div>
);

const Metric = ({ label, value, tone }) => (
  <div className="metric-card">
    <div className="text-xs font-bold uppercase text-slate-500">{label}</div>
    <div className={`mt-2 text-2xl font-black ${tone === 'danger' ? 'text-red-600' : 'text-slate-950'}`}>{value}</div>
  </div>
);

const Badge = ({ value }) => <span className="badge bg-slate-100 text-slate-700">{String(value || '-').replaceAll('_', ' ')}</span>;

const SlaBadge = ({ value }) => {
  const classes = value === 'BREACHED' ? 'badge-danger' : value === 'AT_RISK' ? 'badge-warning' : 'badge-success';
  return <span className={`badge ${classes}`}>{value || 'ON_TIME'}</span>;
};

const match = (item, query, fields) => {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return fields.some((field) => String(item[field] || '').toLowerCase().includes(needle));
};

const formatDate = (value) => value ? new Date(value).toLocaleString() : '-';
const titleFor = (view) => ({
  dashboard: 'CRM Dashboard',
  leads: 'Leads',
  clients: 'Clients',
  deals: 'Deals',
  followups: 'Follow-ups',
  proposals: 'Proposals',
  sla: 'SLA Tracking',
  reports: 'CRM Reports',
}[view] || 'CRM');

export default CrmPage;
