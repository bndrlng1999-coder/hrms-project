import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { employeeAPI, projectTrackerAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../hooks/useNotification';
import { PERMISSIONS, hasPermission } from '../auth/authorization';

const statuses = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const priorities = ['LOW', 'MEDIUM', 'HIGH', 'BLOCKER'];
const projectPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const issueTypes = ['TASK', 'BUG', 'STORY', 'EPIC'];

const emptyIssue = {
  title: '',
  description: '',
  issueType: 'TASK',
  priority: 'MEDIUM',
  status: 'TODO',
  projectId: '',
  sprintId: '',
  assigneeId: '',
  dueDate: '',
  storyPoints: 1,
  labels: '',
};

const emptyProject = {
  name: '',
  projectKey: '',
  description: '',
  startDate: '',
  endDate: '',
  leadId: '',
  status: 'ACTIVE',
  priority: 'MEDIUM',
  memberIds: [],
};

const emptySprint = {
  name: '',
  projectId: '',
  startDate: '',
  endDate: '',
  goal: '',
  status: 'PLANNED',
};

const ProjectTrackerPage = ({ view, startCreateProject = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showError, showSuccess } = useNotification();
  const [projects, setProjects] = useState([]);
  const [issues, setIssues] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [reports, setReports] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ projectId: '', assigneeId: '', priority: '', issueType: '' });
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showSprintForm, setShowSprintForm] = useState(false);
  const [issueForm, setIssueForm] = useState(emptyIssue);
  const [projectForm, setProjectForm] = useState(emptyProject);
  const [sprintForm, setSprintForm] = useState(emptySprint);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState('');

  const canViewEmployees = hasPermission(user, [PERMISSIONS.EMPLOYEE_VIEW_ALL]);
  const canManageProjects = hasPermission(user, [PERMISSIONS.PROJECT_CREATE, PERMISSIONS.PROJECT_UPDATE, PERMISSIONS.PROJECT_MANAGE]);
  const canManageSprints = hasPermission(user, [PERMISSIONS.SPRINT_CREATE, PERMISSIONS.SPRINT_UPDATE, PERMISSIONS.PROJECT_MANAGE]);
  const canChangePriority = ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'TEAM_LEAD'].includes(user?.role);

  useEffect(() => {
    loadBaseData();
  }, []);

  useEffect(() => {
    if (startCreateProject) {
      setShowProjectForm(true);
    }
  }, [startCreateProject]);

  useEffect(() => {
    if (view === 'issue-detail' && id) {
      loadIssueDetail(id);
    }
  }, [view, id]);

  const loadBaseData = async () => {
    try {
      setLoading(true);
      const [projectRes, issueRes, sprintRes, employeeRes, reportRes, notificationRes] = await Promise.all([
        projectTrackerAPI.getProjects(),
        projectTrackerAPI.getIssues(),
        projectTrackerAPI.getSprints(),
        canViewEmployees ? employeeAPI.getAll() : Promise.resolve({ data: { data: [] } }),
        hasPermission(user, [PERMISSIONS.REPORT_VIEW]) ? projectTrackerAPI.getReports() : Promise.resolve({ data: { data: null } }),
        projectTrackerAPI.getNotifications(),
      ]);
      setProjects(projectRes.data.data || []);
      setIssues(issueRes.data.data || []);
      setSprints(sprintRes.data.data || []);
      setEmployees(employeeRes.data.data || []);
      setReports(reportRes.data.data || null);
      setNotifications(notificationRes.data.data || []);
      const firstProjectId = projectRes.data.data?.[0]?.id || '';
      setIssueForm((current) => ({ ...current, projectId: firstProjectId }));
      setProjectForm((current) => ({ ...current, leadId: employeeRes.data.data?.[0]?.id || '' }));
      setSprintForm((current) => ({ ...current, projectId: firstProjectId }));
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to load Project Tracker');
    } finally {
      setLoading(false);
    }
  };

  const refreshIssues = async () => {
    const res = await projectTrackerAPI.getIssues();
    setIssues(res.data.data || []);
    const reportRes = await projectTrackerAPI.getReports();
    setReports(reportRes.data.data || null);
  };

  const loadIssueDetail = async (issueId) => {
    try {
      const [issueRes, commentsRes, activityRes] = await Promise.all([
        projectTrackerAPI.getIssue(issueId),
        projectTrackerAPI.getComments(issueId),
        projectTrackerAPI.getActivity(issueId),
      ]);
      setSelectedIssue(issueRes.data.data);
      setComments(commentsRes.data.data || []);
      setActivity(activityRes.data.data || []);
    } catch (error) {
      showError('Issue not found');
      navigate('/projects/issues');
    }
  };

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      return (!filters.projectId || String(issue.projectId) === String(filters.projectId))
        && (!filters.assigneeId || String(issue.assigneeId) === String(filters.assigneeId))
        && (!filters.priority || issue.priority === filters.priority)
        && (!filters.issueType || issue.issueType === filters.issueType);
    });
  }, [issues, filters]);

  const backlogIssues = filteredIssues.filter((issue) => !issue.sprintId);
  const activeSprint = sprints.find((sprint) => sprint.status === 'ACTIVE');
  const selectedProject = projects.find((project) => String(project.id) === String(id));
  const projectIssues = selectedProject ? issues.filter((issue) => issue.projectId === selectedProject.id) : [];
  const projectSprints = selectedProject ? sprints.filter((sprint) => sprint.projectId === selectedProject.id) : [];

  const saveProject = async (e) => {
    e.preventDefault();
    if (submitting) return;
    try {
      setSubmitting('project');
      await projectTrackerAPI.createProject({
        ...projectForm,
        leadId: Number(projectForm.leadId),
        memberIds: projectForm.memberIds.map(Number),
      });
      showSuccess('Project created');
      setShowProjectForm(false);
      setProjectForm(emptyProject);
      loadBaseData();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to create project');
    } finally {
      setSubmitting('');
    }
  };

  const saveIssue = async (e) => {
    e.preventDefault();
    if (submitting) return;
    try {
      setSubmitting('issue');
      await projectTrackerAPI.createIssue(cleanIssue(issueForm));
      showSuccess('Issue created');
      setShowIssueForm(false);
      setIssueForm({ ...emptyIssue, projectId: projects[0]?.id || '' });
      refreshIssues();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to create issue');
    } finally {
      setSubmitting('');
    }
  };

  const saveSprint = async (e) => {
    e.preventDefault();
    if (submitting) return;
    try {
      setSubmitting('sprint');
      await projectTrackerAPI.createSprint({
        ...sprintForm,
        projectId: Number(sprintForm.projectId),
      });
      showSuccess('Sprint created');
      setShowSprintForm(false);
      setSprintForm({ ...emptySprint, projectId: projects[0]?.id || '' });
      loadBaseData();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to create sprint');
    } finally {
      setSubmitting('');
    }
  };

  const updateStatus = async (issueId, status) => {
    if (submitting) return;
    try {
      setSubmitting(`status-${issueId}`);
      await projectTrackerAPI.updateIssueStatus(issueId, status);
      showSuccess('Issue moved');
      refreshIssues();
      if (selectedIssue?.id === issueId) {
        loadIssueDetail(issueId);
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to update issue');
    } finally {
      setSubmitting('');
    }
  };

  const moveToSprint = async (issue, sprintId) => {
    try {
      await projectTrackerAPI.updateIssue(issue.id, cleanIssue({ ...issue, sprintId }));
      showSuccess('Issue moved to sprint');
      refreshIssues();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to move issue');
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!comment.trim()) return;
    try {
      setSubmitting('comment');
      await projectTrackerAPI.addComment(selectedIssue.id, comment.trim());
      setComment('');
      loadIssueDetail(selectedIssue.id);
      showSuccess('Comment added');
    } catch (error) {
      showError('Failed to add comment');
    } finally {
      setSubmitting('');
    }
  };

  const updateSelectedIssue = async (patch) => {
    try {
      const next = { ...selectedIssue, ...patch };
      await projectTrackerAPI.updateIssue(selectedIssue.id, cleanIssue(next));
      showSuccess('Issue updated');
      loadIssueDetail(selectedIssue.id);
      refreshIssues();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to update issue');
    }
  };

  const changeSprintStatus = async (sprint, action) => {
    try {
      if (action === 'start') {
        await projectTrackerAPI.startSprint(sprint.id);
      } else {
        await projectTrackerAPI.completeSprint(sprint.id);
      }
      showSuccess(action === 'start' ? 'Sprint started' : 'Sprint completed');
      loadBaseData();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to update sprint');
    }
  };

  const cleanIssue = (issue) => ({
    title: issue.title,
    description: issue.description || '',
    issueType: issue.issueType,
    priority: issue.priority,
    status: issue.status,
    projectId: Number(issue.projectId),
    sprintId: issue.sprintId ? Number(issue.sprintId) : null,
    assigneeId: issue.assigneeId ? Number(issue.assigneeId) : null,
    dueDate: issue.dueDate || null,
    storyPoints: issue.storyPoints ? Number(issue.storyPoints) : 0,
    labels: issue.labels || '',
  });

  if (loading) return <div className="page-shell">Loading Project Tracker...</div>;

  return (
    <div className="page-shell">
      <Header view={view} notifications={notifications} onNewIssue={() => setShowIssueForm(true)} />
      <TrackerTabs />

      {view === 'dashboard' && (
        <Dashboard reports={reports} activeSprint={activeSprint} issues={issues} />
      )}

      {view === 'projects' && (
        <Projects projects={projects} canManage={canManageProjects} onCreate={() => setShowProjectForm(true)} />
      )}

      {view === 'project-detail' && (
        <ProjectDetail project={selectedProject} issues={projectIssues} sprints={projectSprints} />
      )}

      {view === 'board' && (
        <>
          <Filters filters={filters} setFilters={setFilters} projects={projects} employees={employees} />
          <Board issues={filteredIssues} onMove={updateStatus} />
        </>
      )}

      {view === 'backlog' && (
        <>
          <Filters filters={filters} setFilters={setFilters} projects={projects} employees={employees} />
          <Backlog issues={backlogIssues} sprints={sprints} onNewIssue={() => setShowIssueForm(true)} onMove={moveToSprint} />
        </>
      )}

      {view === 'sprints' && (
        <Sprints sprints={sprints} canManage={canManageSprints} onCreate={() => setShowSprintForm(true)} onStatus={changeSprintStatus} />
      )}

      {view === 'issues' && (
        <>
          <Filters filters={filters} setFilters={setFilters} projects={projects} employees={employees} />
          <IssuesTable issues={filteredIssues} />
        </>
      )}

      {view === 'reports' && <Reports reports={reports} />}

      {view === 'issue-detail' && selectedIssue && (
        <IssueDetail
          issue={selectedIssue}
          comments={comments}
          activity={activity}
          employees={employees}
          sprints={sprints}
          comment={comment}
          setComment={setComment}
          onComment={submitComment}
          onUpdate={updateSelectedIssue}
          submitting={submitting}
          canChangePriority={canChangePriority}
        />
      )}

      {showProjectForm && (
        <Modal title="Create Project" onClose={() => setShowProjectForm(false)}>
          <ProjectForm form={projectForm} setForm={setProjectForm} employees={employees} onSubmit={saveProject} submitting={submitting === 'project'} canChangePriority={canChangePriority} />
        </Modal>
      )}

      {showIssueForm && (
        <Modal title="Create Issue" onClose={() => setShowIssueForm(false)}>
          <IssueForm form={issueForm} setForm={setIssueForm} projects={projects} sprints={sprints} employees={employees} onSubmit={saveIssue} submitting={submitting === 'issue'} canChangePriority={canChangePriority} />
        </Modal>
      )}

      {showSprintForm && (
        <Modal title="Create Sprint" onClose={() => setShowSprintForm(false)}>
          <SprintForm form={sprintForm} setForm={setSprintForm} projects={projects} onSubmit={saveSprint} submitting={submitting === 'sprint'} />
        </Modal>
      )}
    </div>
  );
};

const Header = ({ view, notifications, onNewIssue }) => (
  <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
    <div>
      <p className="text-sm font-semibold uppercase text-primary-600">Project Tracker</p>
      <h1 className="text-3xl font-bold text-gray-900">{titleFor(view)}</h1>
    </div>
    <div className="flex flex-wrap items-center gap-3">
      <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600">
        {notifications.length} notifications
      </div>
      <button type="button" onClick={onNewIssue} className="btn btn-primary">New Issue</button>
    </div>
  </div>
);

const TrackerTabs = () => {
  const tabs = [
    ['/projects/dashboard', 'Dashboard'],
    ['/projects', 'Projects'],
    ['/projects/board', 'Board'],
    ['/projects/backlog', 'Backlog'],
    ['/projects/sprints', 'Sprints'],
    ['/projects/issues', 'Issues'],
    ['/projects/reports', 'Reports'],
  ];
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {tabs.map(([path, label]) => (
        <Link key={path} to={path} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:border-primary-400 hover:text-primary-700">
          {label}
        </Link>
      ))}
    </div>
  );
};

const Dashboard = ({ reports, activeSprint, issues }) => {
  const cards = [
    ['Total Projects', reports?.totalProjects || 0],
    ['Open Issues', reports?.openIssues || 0],
    ['Completed', reports?.completedIssues || 0],
    ['Bugs', reports?.bugsCount || 0],
    ['Overdue', reports?.overdueTasks || 0],
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        {cards.map(([label, value]) => (
          <div key={label} className="card">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Issue Count by Status" data={reports?.issuesByStatus || {}} />
        <ChartCard title="Issue Count by Priority" data={reports?.issuesByPriority || {}} />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 text-xl font-bold">Active Sprint</h2>
          {activeSprint ? (
            <div>
              <p className="font-semibold">{activeSprint.name}</p>
              <p className="text-sm text-gray-500">{activeSprint.goal}</p>
              <Progress done={activeSprint.completedIssues} total={activeSprint.totalIssues} />
            </div>
          ) : <Empty text="No active sprint" />}
        </div>
        <div className="card">
          <h2 className="mb-4 text-xl font-bold">Recent Work</h2>
          <div className="space-y-3">
            {issues.slice(0, 5).map((issue) => <IssueRow key={issue.id} issue={issue} />)}
          </div>
        </div>
      </div>
    </div>
  );
};

const Projects = ({ projects, canManage, onCreate }) => (
  <div className="card">
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-xl font-bold">Projects</h2>
      {canManage && <button type="button" onClick={onCreate} className="btn btn-primary">Create Project</button>}
    </div>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {projects.map((project) => (
        <Link key={project.id} to={`/projects/${project.id}`} className="rounded-lg border border-gray-200 p-4 hover:border-primary-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-primary-600">{project.projectKey}</p>
              <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
            </div>
            <div className="flex gap-2">
              <Badge value={project.priority} />
              <Badge value={project.status} />
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-600">{project.description}</p>
          <p className="mt-3 text-sm text-gray-500">Lead: {project.leadName || '-'}</p>
        </Link>
      ))}
    </div>
  </div>
);

const ProjectDetail = ({ project, issues, sprints }) => {
  if (!project) {
    return <Empty text="Project not found" />;
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <Link to="/projects" className="text-sm font-semibold text-primary-600 hover:text-primary-700">Back to projects</Link>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-bold text-primary-600">{project.projectKey}</p>
            <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
            <p className="mt-3 max-w-3xl text-gray-600">{project.description || 'No description added yet.'}</p>
          </div>
          <div className="flex gap-2">
            <Badge value={project.priority} />
            <Badge value={project.status} />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <Metric label="Lead" value={project.leadName || '-'} />
          <Metric label="Priority" value={project.priority || 'MEDIUM'} />
          <Metric label="Window" value={`${project.startDate || '-'} to ${project.endDate || '-'}`} />
          <Metric label="Issues" value={issues.length} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="card xl:col-span-2">
          <h3 className="mb-4 text-xl font-bold">Project Issues</h3>
          {issues.length === 0 ? <Empty text="No issues in this project yet" /> : <IssuesTable issues={issues} />}
        </div>
        <div className="card">
          <h3 className="mb-4 text-xl font-bold">Sprints</h3>
          <div className="space-y-3">
            {sprints.length === 0 ? <Empty text="No sprints yet" /> : sprints.map((sprint) => (
              <div key={sprint.id} className="rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-gray-900">{sprint.name}</p>
                  <Badge value={sprint.status} />
                </div>
                <p className="mt-2 text-sm text-gray-500">{sprint.goal || 'No goal added'}</p>
                <Progress done={sprint.completedIssues} total={sprint.totalIssues} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Board = ({ issues, onMove }) => (
  <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
    {statuses.map((status) => (
      <div
        key={status}
        className="min-h-[420px] rounded-lg border border-gray-200 bg-gray-100 p-3"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => onMove(Number(e.dataTransfer.getData('issueId')), status)}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-gray-700">{status.replaceAll('_', ' ')}</h2>
          <span className="rounded-full bg-white px-2 py-1 text-xs text-gray-500">{issues.filter((issue) => issue.status === status).length}</span>
        </div>
        <div className="space-y-3">
          {issues.filter((issue) => issue.status === status).map((issue) => (
            <IssueCard key={issue.id} issue={issue} draggable />
          ))}
        </div>
      </div>
    ))}
  </div>
);

const Backlog = ({ issues, sprints, onNewIssue, onMove }) => (
  <div className="card">
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-xl font-bold">Backlog</h2>
      <button type="button" onClick={onNewIssue} className="btn btn-primary">Create Backlog Issue</button>
    </div>
    {issues.length === 0 ? <Empty text="Backlog is clear" /> : (
      <div className="space-y-3">
        {issues.map((issue) => (
          <div key={issue.id} className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 lg:flex-row lg:items-center lg:justify-between">
            <IssueRow issue={issue} />
            <select className="input-field max-w-xs" defaultValue="" onChange={(e) => e.target.value && onMove(issue, e.target.value)}>
              <option value="">Move to sprint...</option>
              {sprints.filter((sprint) => sprint.status !== 'COMPLETED').map((sprint) => <option key={sprint.id} value={sprint.id}>{sprint.name}</option>)}
            </select>
          </div>
        ))}
      </div>
    )}
  </div>
);

const Sprints = ({ sprints, canManage, onCreate, onStatus }) => (
  <div className="card">
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-xl font-bold">Sprints</h2>
      {canManage && <button type="button" onClick={onCreate} className="btn btn-primary">Create Sprint</button>}
    </div>
    <div className="space-y-4">
      {sprints.map((sprint) => (
        <div key={sprint.id} className="rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">{sprint.name}</h3>
                <Badge value={sprint.status} />
              </div>
              <p className="text-sm text-gray-500">{sprint.projectKey} - {sprint.goal}</p>
            </div>
            {canManage && (
              <div className="flex gap-2">
                {sprint.status === 'PLANNED' && <button type="button" className="btn btn-primary" onClick={() => onStatus(sprint, 'start')}>Start</button>}
                {sprint.status === 'ACTIVE' && <button type="button" className="btn btn-secondary" onClick={() => onStatus(sprint, 'complete')}>Complete</button>}
              </div>
            )}
          </div>
          <Progress done={sprint.completedIssues} total={sprint.totalIssues} />
        </div>
      ))}
    </div>
  </div>
);

const IssuesTable = ({ issues }) => (
  <div className="card overflow-x-auto">
    {issues.length === 0 ? <Empty text="No issues match the current filters" /> : (
      <table className="table">
        <thead className="table-header">
          <tr>
            <th className="table-cell">Key</th>
            <th className="table-cell">Title</th>
            <th className="table-cell">Type</th>
            <th className="table-cell">Priority</th>
            <th className="table-cell">Status</th>
            <th className="table-cell">Assignee</th>
            <th className="table-cell">Due</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => (
            <tr key={issue.id} className="table-row">
              <td className="table-cell font-semibold"><Link to={`/projects/issues/${issue.id}`}>{issue.issueKey}</Link></td>
              <td className="table-cell">{issue.title}</td>
              <td className="table-cell">{issue.issueType}</td>
              <td className="table-cell"><Badge value={issue.priority} /></td>
              <td className="table-cell"><Badge value={issue.status} /></td>
              <td className="table-cell">{issue.assigneeName || '-'}</td>
              <td className="table-cell">{issue.dueDate || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

const IssueDetail = ({ issue, comments, activity, employees, sprints, comment, setComment, onComment, onUpdate, submitting, canChangePriority }) => (
  <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
    <div className="xl:col-span-2 space-y-6">
      <div className="card">
        <p className="text-sm font-bold text-primary-600">{issue.issueKey}</p>
        <h2 className="mt-1 text-2xl font-bold text-gray-900">{issue.title}</h2>
        <p className="mt-4 text-gray-600">{issue.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge value={issue.issueType} />
          <Badge value={issue.priority} />
          <Badge value={issue.status} />
        </div>
      </div>
      <div className="card">
        <h3 className="mb-4 text-lg font-bold">Comments</h3>
        <form onSubmit={onComment} className="mb-4 flex gap-2">
          <input className="input-field" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment" />
          <button type="submit" disabled={submitting === 'comment'} className="btn btn-primary">
            {submitting === 'comment' ? 'Adding...' : 'Add'}
          </button>
        </form>
        <div className="space-y-3">
          {comments.map((item) => (
            <div key={item.id} className="rounded-lg bg-gray-50 p-3">
              <p className="text-sm font-semibold">{item.authorName}</p>
              <p className="text-sm text-gray-600">{item.comment}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h3 className="mb-4 text-lg font-bold">Activity</h3>
        <div className="space-y-3">
          {activity.map((item) => (
            <div key={item.id} className="border-l-4 border-primary-200 pl-3">
              <p className="text-sm font-semibold">{item.activityType}</p>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
    <div className="card h-fit space-y-4">
      <Field label="Status">
        <select className="input-field" value={issue.status} onChange={(e) => onUpdate({ status: e.target.value })}>
          {statuses.map((status) => <option key={status}>{status}</option>)}
        </select>
      </Field>
      <Field label="Assignee">
        <select className="input-field" value={issue.assigneeId || ''} onChange={(e) => onUpdate({ assigneeId: e.target.value })}>
          <option value="">Unassigned</option>
          {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.firstName} {employee.lastName}</option>)}
        </select>
      </Field>
      <Field label="Sprint">
        <select className="input-field" value={issue.sprintId || ''} onChange={(e) => onUpdate({ sprintId: e.target.value })}>
          <option value="">Backlog</option>
          {sprints.map((sprint) => <option key={sprint.id} value={sprint.id}>{sprint.name}</option>)}
        </select>
      </Field>
      <Field label="Priority">
        <select className="input-field" value={issue.priority} disabled={!canChangePriority} onChange={(e) => onUpdate({ priority: e.target.value })}>
          {priorities.map((priority) => <option key={priority}>{priority}</option>)}
        </select>
      </Field>
      <Field label="Due Date">
        <input className="input-field" type="date" value={issue.dueDate || ''} onChange={(e) => onUpdate({ dueDate: e.target.value })} />
      </Field>
      <Field label="Story Points">
        <input className="input-field" type="number" value={issue.storyPoints || 0} onChange={(e) => onUpdate({ storyPoints: e.target.value })} />
      </Field>
    </div>
  </div>
);

const Reports = ({ reports }) => (
  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
    <ChartCard title="Issue Count by Status" data={reports?.issuesByStatus || {}} />
    <ChartCard title="Issue Count by Priority" data={reports?.issuesByPriority || {}} />
    <div className="card lg:col-span-2">
      <h2 className="mb-4 text-xl font-bold">Employee Workload</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {(reports?.employeeWorkload || []).map((row) => (
          <div key={row.employeeId} className="rounded-lg bg-gray-50 p-4">
            <p className="font-semibold">{row.employeeName}</p>
            <p className="text-2xl font-bold text-primary-600">{row.issueCount}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const Filters = ({ filters, setFilters, projects, employees }) => (
  <div className="card mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
    <select className="input-field" value={filters.projectId} onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}>
      <option value="">All projects</option>
      {projects.map((project) => <option key={project.id} value={project.id}>{project.projectKey} - {project.name}</option>)}
    </select>
    <select className="input-field" value={filters.assigneeId} onChange={(e) => setFilters({ ...filters, assigneeId: e.target.value })}>
      <option value="">All assignees</option>
      {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.firstName} {employee.lastName}</option>)}
    </select>
    <select className="input-field" value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
      <option value="">All priorities</option>
      {priorities.map((priority) => <option key={priority}>{priority}</option>)}
    </select>
    <select className="input-field" value={filters.issueType} onChange={(e) => setFilters({ ...filters, issueType: e.target.value })}>
      <option value="">All types</option>
      {issueTypes.map((type) => <option key={type}>{type}</option>)}
    </select>
  </div>
);

const IssueCard = ({ issue, draggable }) => (
  <Link
    to={`/projects/issues/${issue.id}`}
    draggable={draggable}
    onDragStart={(e) => e.dataTransfer.setData('issueId', issue.id)}
    className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:border-primary-300"
  >
    <div className="mb-2 flex items-center justify-between">
      <span className="text-xs font-bold text-primary-600">{issue.issueKey}</span>
      <span className="text-xs font-semibold text-gray-500">{issue.storyPoints || 0} pts</span>
    </div>
    <h3 className="font-semibold text-gray-900">{issue.title}</h3>
    <div className="mt-3 flex flex-wrap gap-2">
      <Badge value={issue.issueType} />
      <Badge value={issue.priority} />
    </div>
    <p className="mt-3 text-sm text-gray-500">{issue.assigneeName || 'Unassigned'} - due {issue.dueDate || '-'}</p>
  </Link>
);

const IssueRow = ({ issue }) => (
  <div className="min-w-0">
    <Link to={`/projects/issues/${issue.id}`} className="font-semibold text-gray-900 hover:text-primary-700">{issue.issueKey}: {issue.title}</Link>
    <p className="text-sm text-gray-500">{issue.projectKey} - {issue.assigneeName || 'Unassigned'} - {issue.status}</p>
  </div>
);

const ProjectForm = ({ form, setForm, employees, onSubmit, submitting, canChangePriority }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <input className="input-field" placeholder="Project name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
    <input className="input-field" placeholder="Project key, e.g. TAN" value={form.projectKey} onChange={(e) => setForm({ ...form, projectKey: e.target.value.toUpperCase() })} required />
    <textarea className="input-field" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
    <div className="grid grid-cols-2 gap-3">
      <input className="input-field" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
      <input className="input-field" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
    </div>
    <select className="input-field" value={form.leadId} onChange={(e) => setForm({ ...form, leadId: e.target.value })} required>
      <option value="">Project lead</option>
      {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.firstName} {employee.lastName}</option>)}
    </select>
    <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
      {['ACTIVE', 'ON_HOLD', 'COMPLETED'].map((status) => <option key={status}>{status}</option>)}
    </select>
    {canChangePriority && (
      <select className="input-field" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
        {projectPriorities.map((priority) => <option key={priority}>{priority}</option>)}
      </select>
    )}
    <button type="submit" disabled={submitting} className="btn btn-primary">{submitting ? 'Saving...' : 'Save Project'}</button>
  </form>
);

const IssueForm = ({ form, setForm, projects, sprints, employees, onSubmit, submitting, canChangePriority }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <input className="input-field" placeholder="Issue title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
    <textarea className="input-field" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
    <div className="grid grid-cols-2 gap-3">
      <select className="input-field" value={form.issueType} onChange={(e) => setForm({ ...form, issueType: e.target.value })}>{issueTypes.map((type) => <option key={type}>{type}</option>)}</select>
      <select className="input-field" value={form.priority} disabled={!canChangePriority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select>
    </div>
    <select className="input-field" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} required>
      <option value="">Project</option>
      {projects.map((project) => <option key={project.id} value={project.id}>{project.projectKey} - {project.name}</option>)}
    </select>
    <select className="input-field" value={form.sprintId} onChange={(e) => setForm({ ...form, sprintId: e.target.value })}>
      <option value="">Backlog</option>
      {sprints.map((sprint) => <option key={sprint.id} value={sprint.id}>{sprint.name}</option>)}
    </select>
    <select className="input-field" value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}>
      <option value="">Unassigned</option>
      {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.firstName} {employee.lastName}</option>)}
    </select>
    <div className="grid grid-cols-2 gap-3">
      <input className="input-field" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
      <input className="input-field" type="number" min="0" value={form.storyPoints} onChange={(e) => setForm({ ...form, storyPoints: e.target.value })} />
    </div>
    <input className="input-field" placeholder="Labels, comma-separated" value={form.labels} onChange={(e) => setForm({ ...form, labels: e.target.value })} />
    <button type="submit" disabled={submitting} className="btn btn-primary">{submitting ? 'Saving...' : 'Save Issue'}</button>
  </form>
);

const SprintForm = ({ form, setForm, projects, onSubmit, submitting }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <input className="input-field" placeholder="Sprint name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
    <select className="input-field" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} required>
      <option value="">Project</option>
      {projects.map((project) => <option key={project.id} value={project.id}>{project.projectKey} - {project.name}</option>)}
    </select>
    <div className="grid grid-cols-2 gap-3">
      <input className="input-field" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
      <input className="input-field" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
    </div>
    <textarea className="input-field" placeholder="Sprint goal" value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} />
    <button type="submit" disabled={submitting} className="btn btn-primary">{submitting ? 'Saving...' : 'Save Sprint'}</button>
  </form>
);

const Modal = ({ title, children, onClose }) => (
  <div className="modal">
    <div className="modal-content p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">{title}</h2>
        <button type="button" onClick={onClose} className="btn btn-secondary">Close</button>
      </div>
      {children}
    </div>
  </div>
);

const ChartCard = ({ title, data }) => {
  const entries = Object.entries(data);
  const max = Math.max(...entries.map(([, value]) => Number(value)), 1);
  return (
    <div className="card">
      <h2 className="mb-4 text-xl font-bold">{title}</h2>
      {entries.length === 0 ? <Empty text="No data yet" /> : entries.map(([label, value]) => (
        <div key={label} className="mb-3">
          <div className="mb-1 flex justify-between text-sm">
            <span>{label.replaceAll('_', ' ')}</span>
            <span>{value}</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100">
            <div className="h-2 rounded-full bg-primary-600" style={{ width: `${(Number(value) / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
};

const Progress = ({ done, total }) => {
  const percent = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="mt-4">
      <div className="mb-1 flex justify-between text-sm text-gray-500">
        <span>{done}/{total} completed</span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100">
        <div className="h-2 rounded-full bg-green-600" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
};

const Field = ({ label, children }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-semibold text-gray-700">{label}</span>
    {children}
  </label>
);

const Metric = ({ label, value }) => (
  <div className="rounded-lg bg-gray-50 p-4">
    <p className="text-sm font-semibold text-gray-500">{label}</p>
    <p className="mt-1 text-lg font-bold text-gray-900">{value}</p>
  </div>
);

const Badge = ({ value }) => {
  const key = String(value || '-');
  const tone = {
    LOW: 'bg-slate-100 text-slate-700',
    MEDIUM: 'bg-blue-100 text-blue-700',
    HIGH: 'bg-amber-100 text-amber-800',
    CRITICAL: 'bg-red-100 text-red-700',
    BLOCKER: 'bg-red-100 text-red-700',
  }[key] || 'bg-gray-100 text-gray-700';
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{key.replaceAll('_', ' ')}</span>;
};

const Empty = ({ text }) => <div className="py-10 text-center text-gray-500">{text}</div>;

const titleFor = (view) => ({
  dashboard: 'Tracker Dashboard',
  projects: 'Projects',
  'project-detail': 'Project Detail',
  board: 'Kanban Board',
  backlog: 'Backlog',
  sprints: 'Sprints',
  issues: 'Issues',
  reports: 'Reports',
  'issue-detail': 'Issue Detail',
}[view] || 'Project Tracker');

export default ProjectTrackerPage;

