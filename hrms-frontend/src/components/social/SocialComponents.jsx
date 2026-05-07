import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export const Avatar = ({ name = 'Tanvox', src, size = 'md', tone = 'primary' }) => {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-11 w-11 text-sm',
    lg: 'h-16 w-16 text-lg',
    xl: 'h-24 w-24 text-2xl',
  };
  const tones = {
    primary: 'from-primary-700 to-cyan-600',
    green: 'from-emerald-600 to-teal-500',
    amber: 'from-amber-500 to-orange-600',
    rose: 'from-rose-500 to-fuchsia-600',
    slate: 'from-slate-800 to-slate-600',
  };

  if (src) {
    return <img src={src} alt={name} className={`${sizes[size]} shrink-0 rounded-full object-cover ring-2 ring-white`} />;
  }

  return (
    <span className={`${sizes[size]} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${tones[tone] || tones.primary} font-black text-white shadow-lg shadow-slate-900/15 ring-2 ring-white`}>
      {initials(name)}
    </span>
  );
};

export const StatusBadge = ({ value, tone }) => (
  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${badgeTone(tone || value)}`}>
    {String(value || 'Open').replaceAll('_', ' ')}
  </span>
);

export const PriorityBadge = ({ value }) => (
  <StatusBadge value={value || 'Medium'} tone={value || 'MEDIUM'} />
);

export const StatsStoryCards = ({ items }) => (
  <div className="story-strip">
    {items.map((item) => (
      <Link key={item.label} to={item.to || '/dashboard'} className="story-card">
        <div className={`story-orb ${item.tone || 'bg-primary-700'}`}>{item.icon}</div>
        <div className="min-w-0">
          <p className="truncate text-xs font-black uppercase tracking-wide text-slate-500">{item.label}</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{item.value}</p>
        </div>
      </Link>
    ))}
  </div>
);

export const SocialFeedCard = ({ item }) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <article className="social-feed-card">
      <div className="flex gap-3">
        <Avatar name={item.actor || item.title} tone={item.tone} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-base font-black text-slate-950">{item.title}</h3>
                <StatusBadge value={item.module || 'Company'} tone={item.tone} />
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-500">{item.actor || 'Tanvox'} - {formatTime(item.timestamp)}</p>
            </div>
            {item.priority && <PriorityBadge value={item.priority} />}
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-600">{item.description}</p>

          {item.meta?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {item.meta.map((meta) => <span key={meta} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{meta}</span>)}
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <div className="flex flex-wrap gap-2">
              <SocialAction active={liked} onClick={() => setLiked((current) => !current)} label={liked ? 'Liked' : 'Like'} />
              <SocialAction label="Comment" to={item.commentTo || item.to || '/dashboard'} />
              <SocialAction active={saved} onClick={() => setSaved((current) => !current)} label={saved ? 'Saved' : 'Save'} />
              <SocialAction label="Share" to="/mail/compose" />
            </div>
            {item.to && <Link to={item.to} className="btn btn-primary">View Details</Link>}
          </div>
        </div>
      </div>
    </article>
  );
};

export const ActivityTimeline = ({ items }) => (
  <div className="activity-timeline">
    {items.length === 0 ? <EmptyState title="No activity yet" message="New updates will appear as teams work across HR, CRM, finance, and projects." /> : items.map((item) => (
      <Link key={`${item.type}-${item.id}`} to={item.to || '/dashboard'} className="timeline-item">
        <span className="timeline-dot" />
        <div>
          <p className="text-sm font-black text-slate-900">{item.title}</p>
          <p className="mt-1 text-xs text-slate-500">{formatTime(item.timestamp)}</p>
        </div>
      </Link>
    ))}
  </div>
);

export const ProfileWidget = ({ user, employee }) => (
  <aside className="social-widget overflow-hidden p-0">
    <div className="h-20 bg-gradient-to-r from-primary-800 via-cyan-700 to-emerald-500" />
    <div className="-mt-8 px-5 pb-5">
      <Avatar name={employee ? `${employee.firstName} ${employee.lastName}` : user?.email} size="lg" />
      <h2 className="mt-3 truncate text-lg font-black text-slate-950">{employee ? `${employee.firstName} ${employee.lastName}` : user?.email}</h2>
      <p className="mt-1 text-sm font-semibold text-slate-500">{employee?.designation || user?.role}</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <MiniMetric label="Role" value={user?.role || '-'} />
        <MiniMetric label="Code" value={employee?.employeeCode || '-'} />
      </div>
      <Link to="/profile" className="btn btn-secondary mt-4 w-full">Open Profile</Link>
    </div>
  </aside>
);

export const ModuleBannerCard = ({ eyebrow, title, description, to, actionLabel = 'Open', tone = 'from-primary-700 to-cyan-600' }) => (
  <Link to={to || '/dashboard'} className={`module-banner bg-gradient-to-br ${tone}`}>
    <p className="text-xs font-black uppercase tracking-[0.18em] text-white/75">{eyebrow}</p>
    <h3 className="mt-3 text-2xl font-black text-white">{title}</h3>
    <p className="mt-2 text-sm leading-6 text-white/80">{description}</p>
    <span className="mt-5 inline-flex rounded-full bg-white/20 px-4 py-2 text-sm font-black text-white backdrop-blur">{actionLabel}</span>
  </Link>
);

export const QuickActionButton = ({ actions }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-6 right-6 z-30">
      {open && (
        <div className="mb-3 grid gap-2 rounded-lg border border-slate-200 bg-white/95 p-2 shadow-2xl shadow-slate-900/20 backdrop-blur-xl">
          {actions.map((action) => (
            <Link key={action.to} to={action.to} className="rounded-md px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-primary-50 hover:text-primary-800">
              {action.label}
            </Link>
          ))}
        </div>
      )}
      <button type="button" className="floating-action" onClick={() => setOpen((current) => !current)} aria-label="Open quick actions">
        +
      </button>
    </div>
  );
};

export const FloatingActionMenu = QuickActionButton;

export const NotificationDrawer = ({ open, notifications = [], onClose }) => (
  <div className={`fixed inset-y-0 right-0 z-50 w-[min(24rem,92vw)] border-l border-slate-200 bg-white p-4 shadow-2xl shadow-slate-950/20 transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-lg font-black text-slate-950">Notifications</h2>
      <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
    </div>
    <div className="space-y-3">
      {notifications.length === 0 ? <EmptyState title="No notifications" /> : notifications.map((item) => (
        <div key={item.id} className="rounded-lg border border-slate-200 p-3">
          <p className="text-sm font-black text-slate-900">{item.title}</p>
          <p className="mt-1 text-xs text-slate-500">{item.message}</p>
        </div>
      ))}
    </div>
  </div>
);

export const AnimatedModal = ({ title, children, onClose }) => (
  <div className="modal">
    <div className="modal-content p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-black text-slate-950">{title}</h2>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
      </div>
      {children}
    </div>
  </div>
);

export const ToastNotification = ({ title, message, tone = 'primary' }) => (
  <div className={`rounded-lg border p-4 shadow-xl ${badgeTone(tone)}`}>
    <p className="font-black">{title}</p>
    {message && <p className="mt-1 text-sm">{message}</p>}
  </div>
);

export const AvatarStack = ({ names = [] }) => (
  <div className="flex -space-x-2">
    {names.slice(0, 5).map((name) => <Avatar key={name} name={name} size="sm" />)}
    {names.length > 5 && <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white ring-2 ring-white">+{names.length - 5}</span>}
  </div>
);

export const EmptyState = ({ title, message, action }) => (
  <div className="rounded-lg border border-dashed border-slate-250 bg-slate-50/70 px-6 py-10 text-center">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-xl font-black text-primary-700 shadow-sm">TX</div>
    <h3 className="mt-4 text-lg font-black text-slate-950">{title}</h3>
    {message && <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{message}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const LoadingSkeleton = ({ count = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="social-feed-card">
        <div className="flex gap-3">
          <div className="skeleton h-11 w-11 rounded-full" />
          <div className="flex-1 space-y-3">
            <div className="skeleton h-4 w-2/3" />
            <div className="skeleton h-3 w-1/3" />
            <div className="skeleton h-20 w-full" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const MiniMetric = ({ label, value }) => (
  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
    <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 truncate text-xs font-black text-slate-800">{value}</p>
  </div>
);

const SocialAction = ({ label, active, onClick, to }) => {
  const className = `rounded-full px-3 py-2 text-xs font-black transition-all duration-200 hover:-translate-y-0.5 ${active ? 'bg-primary-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-primary-50 hover:text-primary-800'}`;
  if (to) return <Link to={to} className={className}>{label}</Link>;
  return <button type="button" className={className} onClick={onClick}>{label}</button>;
};

const badgeTone = (tone = '') => {
  const key = String(tone).toUpperCase();
  if (['HIGH', 'CRITICAL', 'BLOCKER', 'DANGER', 'ROSE'].includes(key)) return 'bg-red-50 text-red-700 ring-1 ring-red-100';
  if (['MEDIUM', 'WARNING', 'AMBER', 'PENDING'].includes(key)) return 'bg-amber-50 text-amber-800 ring-1 ring-amber-100';
  if (['LOW', 'SUCCESS', 'GREEN', 'APPROVED', 'DONE', 'RESOLVED'].includes(key)) return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100';
  if (['CRM', 'PROJECTS', 'PROJECT'].includes(key)) return 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100';
  return 'bg-primary-50 text-primary-700 ring-1 ring-primary-100';
};

export const formatTime = (value) => {
  if (!value) return 'Just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const initials = (value = '') => {
  const clean = String(value).replace(/@.*/, '').replace(/[^a-zA-Z0-9]+/g, ' ').trim();
  if (!clean) return 'TX';
  return clean.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
};
