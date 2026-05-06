import React from 'react';
import { Link } from 'react-router-dom';

const ComingSoonPage = ({ title, category, description }) => (
  <div className="page-shell">
    <div className="mx-auto max-w-5xl">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-200/80">
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-5">
          <p className="section-eyebrow">{category || 'Workspace'}</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">{title}</h1>
        </div>
        <div className="grid gap-8 p-6 lg:grid-cols-[1fr_280px] lg:p-8">
          <div>
            <div className="inline-flex rounded-full border border-primary-100 bg-primary-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-primary-700">
              Coming Soon
            </div>
            <h2 className="mt-5 text-2xl font-bold text-slate-950">This module is being prepared.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              {description || 'The route is wired into navigation and protected by the same access rules, so the page can be filled in without changing the sidebar again.'}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/dashboard" className="btn btn-primary">Back to dashboard</Link>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-bold text-slate-900">Empty state</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              No records are available yet. Once this feature is enabled, activity and quick actions will appear here.
            </p>
            <div className="mt-5 space-y-3">
              <div className="h-2 rounded-full bg-slate-200" />
              <div className="h-2 w-4/5 rounded-full bg-slate-200" />
              <div className="h-2 w-2/3 rounded-full bg-slate-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ComingSoonPage;
