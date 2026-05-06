import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  changePassword: (data) => api.post('/auth/change-password', data),
  validateToken: () => api.get('/auth/validate'),
  me: () => api.get('/auth/me'),
};

export const rolePermissionAPI = {
  getMatrix: () => api.get('/admin/roles-permissions'),
  updateRole: (role, permissions) => api.put(`/admin/roles-permissions/${role}`, { permissions }),
};

export const userAdminAPI = {
  getAll: () => api.get('/admin/users'),
  create: (data) => api.post('/admin/users', data),
  assignRole: (id, role) => api.put(`/admin/users/${id}/role`, null, { params: { role } }),
  updateStatus: (id, status) => api.put(`/admin/users/${id}/status`, null, { params: { status } }),
  disable: (id) => api.put(`/users/${id}/disable`),
  enable: (id) => api.put(`/users/${id}/enable`),
  resetPassword: (id) => api.post(`/admin/users/${id}/reset-password`),
};

export const employeeAPI = {
  getAll: () => api.get('/employees'),
  getById: (id) => api.get(`/employees/${id}`),
  getByUserId: (userId) => api.get(`/employees/user/${userId}`),
  getDepartment: (deptId) => api.get(`/employees/department/${deptId}`),
  create: (data) => api.post('/employees', data),
  createIntern: (data) => api.post('/employees/interns', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
};

export const attendanceAPI = {
  getByEmployee: (empId) => api.get(`/attendance/employee/${empId}`),
  getAll: () => api.get('/attendance'),
  getPending: () => api.get('/attendance/pending'),
  getPendingApprovals: () => api.get('/attendance/pending-approvals'),
  today: () => api.get('/attendance/today'),
  myCalendar: (params = {}) => api.get('/attendance/my-calendar', { params }),
  myHistory: () => api.get('/attendance/my-history'),
  checkIn: () => api.post('/attendance/check-in'),
  checkOut: () => api.post('/attendance/check-out'),
  mark: (data) => api.post('/attendance', data),
  approve: (id) => api.put(`/attendance/${id}/approve`),
  reject: (id, reason) => api.put(`/attendance/${id}/reject`, { reason }),
  regularize: (id, data) => api.post(`/attendance/${id}/regularize`, data),
  getPendingRegularizations: () => api.get('/attendance/regularization/pending'),
  approveRegularization: (id) => api.put(`/attendance/regularization/${id}/approve`),
  rejectRegularization: (id, reason) => api.put(`/attendance/regularization/${id}/reject`, { reason }),
  requestWorkFromHome: (data) => api.post('/work-from-home', data),
  approveWorkFromHome: (id) => api.put(`/work-from-home/${id}/approve`),
  requestOnDuty: (data) => api.post('/on-duty', data),
  approveOnDuty: (id) => api.put(`/on-duty/${id}/approve`),
};

export const shiftAPI = {
  getAll: () => api.get('/shifts'),
  create: (data) => api.post('/shifts', data),
  update: (id, data) => api.put(`/shifts/${id}`, data),
  assign: (data) => api.post('/shifts/assign', data),
};

export const holidayAPI = {
  getAll: (params = {}) => api.get('/holidays', { params }),
  create: (data) => api.post('/holidays', data),
};

export const attendanceReportAPI = {
  monthly: (params = {}) => api.get('/reports/attendance/monthly', { params }),
  employee: (employeeId, params = {}) => api.get(`/reports/attendance/employee/${employeeId}`, { params }),
};

export const leaveAPI = {
  apply: (data) => api.post('/leave/apply', data),
  getByEmployee: (empId) => api.get(`/leave/employee/${empId}`),
  getPending: () => api.get('/leave/pending'),
  approve: (id, approvedBy) => api.put(`/leave/${id}/approve`, null, { params: { approvedBy } }),
  reject: (id) => api.put(`/leave/${id}/reject`),
};

export const payslipAPI = {
  getByEmployee: (empId) => api.get(`/payslips/employee/${empId}`),
  getAll: () => api.get('/payslips'),
  generate: (data) => api.post('/payslips/generate', data),
};

export const announcementAPI = {
  getAll: () => api.get('/announcements'),
  create: (data) => api.post('/announcements', data),
  getById: (id) => api.get(`/announcements/${id}`),
  update: (id, data) => api.put(`/announcements/${id}`, data),
  delete: (id) => api.delete(`/announcements/${id}`),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export const departmentAPI = {
  getAll: () => api.get('/departments'),
};

export const helpdeskAPI = {
  getTickets: () => api.get('/helpdesk/tickets'),
  createTicket: (data) => api.post('/helpdesk/tickets', data),
  reply: (id, data) => api.post(`/helpdesk/tickets/${id}/reply`, data),
};

export const documentAPI = {
  getAll: () => api.get('/documents'),
  upload: (data) => api.post('/documents', data),
};

export const projectTrackerAPI = {
  getProjects: () => api.get('/projects'),
  getProject: (id) => api.get(`/projects/${id}`),
  createProject: (data) => api.post('/projects', data),
  updateProject: (id, data) => api.put(`/projects/${id}`, data),
  deleteProject: (id) => api.delete(`/projects/${id}`),
  updateMembers: (id, data) => api.put(`/projects/${id}/members`, data),

  getIssues: (params = {}) => api.get('/issues', { params }),
  getIssue: (id) => api.get(`/issues/${id}`),
  createIssue: (data) => api.post('/issues', data),
  updateIssue: (id, data) => api.put(`/issues/${id}`, data),
  updateIssueStatus: (id, status) => api.put(`/issues/${id}/status`, { status }),
  getComments: (id) => api.get(`/issues/${id}/comments`),
  addComment: (id, comment) => api.post(`/issues/${id}/comments`, { comment }),
  getActivity: (id) => api.get(`/issues/${id}/activity`),

  getSprints: (params = {}) => api.get('/sprints', { params }),
  getSprint: (id) => api.get(`/sprints/${id}`),
  createSprint: (data) => api.post('/sprints', data),
  updateSprint: (id, data) => api.put(`/sprints/${id}`, data),
  startSprint: (id) => api.put(`/sprints/${id}/start`),
  completeSprint: (id) => api.put(`/sprints/${id}/complete`),

  getReports: () => api.get('/reports/project-tracker'),
  getNotifications: () => api.get('/notifications'),
};

export const approvalAPI = {
  queue: () => api.get('/approvals/queue'),
  timeline: (workflowId) => api.get(`/approvals/${workflowId}/timeline`),
  approve: (workflowId, remarks = '') => api.put(`/approvals/${workflowId}/approve`, { remarks }),
  reject: (workflowId, remarks = '') => api.put(`/approvals/${workflowId}/reject`, { remarks }),
};

export const crmAPI = {
  getLeads: () => api.get('/crm/leads'),
  createLead: (data) => api.post('/crm/leads', data),
  updateLead: (id, data) => api.put(`/crm/leads/${id}`, data),
  getClients: () => api.get('/crm/clients'),
  createClient: (data) => api.post('/crm/clients', data),
  getDeals: () => api.get('/crm/deals'),
  createDeal: (data) => api.post('/crm/deals', data),
  createFollowUp: (data) => api.post('/crm/follow-ups', data),
  createProposal: (data) => api.post('/crm/proposals', data),
  slaReport: () => api.get('/crm/reports/sla'),
};

const mailFormData = (payload, files = []) => {
  const formData = new FormData();
  formData.append('payload', JSON.stringify(payload));
  files.forEach((file) => formData.append('files', file));
  return formData;
};

export const internalMailAPI = {
  getSummary: () => api.get('/internal-mails/summary'),
  getContacts: () => api.get('/internal-mails/contacts'),
  getInbox: (params = {}) => api.get('/internal-mails/inbox', { params }),
  getSent: () => api.get('/internal-mails/sent'),
  getDrafts: () => api.get('/internal-mails/drafts'),
  getTrash: () => api.get('/internal-mails/trash'),
  getStarred: () => api.get('/internal-mails/starred'),
  search: (query) => api.get('/internal-mails/search', { params: { query } }),
  getMessage: (id) => api.get(`/internal-mails/${id}`),
  compose: (payload, files = []) => files.length
    ? api.post('/internal-mails/compose', mailFormData(payload, files), { headers: { 'Content-Type': 'multipart/form-data' } })
    : api.post('/internal-mails/compose', payload),
  saveDraft: (payload) => api.post('/internal-mails/draft', payload),
  markRead: (id) => api.put(`/internal-mails/${id}/read`),
  markUnread: (id) => api.put(`/internal-mails/${id}/unread`),
  toggleStar: (id) => api.put(`/internal-mails/${id}/star`),
  toggleImportant: (id) => api.put(`/internal-mails/${id}/important`),
  reply: (id, payload, files = []) => files.length
    ? api.post(`/internal-mails/${id}/reply`, mailFormData(payload, files), { headers: { 'Content-Type': 'multipart/form-data' } })
    : api.post(`/internal-mails/${id}/reply`, payload),
  forward: (id, payload, files = []) => files.length
    ? api.post(`/internal-mails/${id}/forward`, mailFormData(payload, files), { headers: { 'Content-Type': 'multipart/form-data' } })
    : api.post(`/internal-mails/${id}/forward`, payload),
  delete: (id) => api.delete(`/internal-mails/${id}`),
  createMailbox: (employeeId) => api.post(`/internal-mails/mailboxes/${employeeId}`),
  syncMailboxes: () => api.post('/internal-mails/mailboxes/sync'),
};

export default api;
