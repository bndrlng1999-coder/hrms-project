import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { filterNavigationItems } from '../auth/authorization';
import { sidebarMenu } from '../navigation/sidebarMenu';

const storageKey = 'hrms.sidebar.expandedCategory';

const categoryIcons = {
  dashboard: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 13h8V3H3v10Z" />
      <path d="M13 21h8V11h-8v10Z" />
      <path d="M13 3v6h8V3h-8Z" />
      <path d="M3 21h8v-6H3v6Z" />
    </svg>
  ),
  people: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  projects: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7h18" />
      <path d="M6 3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z" />
      <path d="M8 12h3" />
      <path d="M8 16h8" />
    </svg>
  ),
  crm: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="m7 15 4-4 3 3 5-7" />
    </svg>
  ),
  finance: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 10h18" />
      <path d="M7 15h.01" />
      <path d="M11 15h2" />
      <path d="M6 4h12a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Z" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.38 1.1V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8.6 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 0-1.1-.38H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 8.6a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-.6 1.65 1.65 0 0 0 .38-1.1V3a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 15.4 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.25.38.6.73 1 .9.36.15.73.22 1.1.22H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51.88Z" />
    </svg>
  ),
};

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = useMemo(() => filterNavigationItems(sidebarMenu, user), [user]);
  const activeCategory = useMemo(
    () => menuItems.find((item) => item.children?.some((child) => isActivePath(location.pathname, child))),
    [location.pathname, menuItems]
  );
  const [expandedCategory, setExpandedCategory] = useState(() => localStorage.getItem(storageKey) || activeCategory?.id || 'dashboard');

  useEffect(() => {
    if (!expandedCategory && activeCategory?.id) {
      setExpandedCategory(activeCategory.id);
    }
  }, [activeCategory?.id, expandedCategory]);

  useEffect(() => {
    if (expandedCategory) {
      localStorage.setItem(storageKey, expandedCategory);
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [expandedCategory]);

  const toggleCategory = (id) => {
    setExpandedCategory((current) => (current === id ? '' : id));
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 px-4 py-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Signed in</div>
          <div className="mt-2 truncate text-sm font-semibold text-slate-950">{user?.email}</div>
          <div className="mt-1 truncate text-xs font-medium text-primary-700">{user?.role}</div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {menuItems.map((item) => {
          const expanded = expandedCategory === item.id;
          const active = activeCategory?.id === item.id;

          return (
            <div key={item.id}>
              <button
                type="button"
                onClick={() => toggleCategory(item.id)}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-bold transition-all duration-200 ${
                  active ? 'bg-primary-50 text-primary-800 ring-1 ring-primary-100' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                  active ? 'bg-white text-primary-700 shadow-sm' : 'bg-slate-100 text-slate-500'
                }`}>
                  {categoryIcons[item.icon]}
                </span>
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                <svg
                  viewBox="0 0 20 20"
                  className={`h-4 w-4 shrink-0 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L10.94 10 7.23 6.29a.75.75 0 1 1 1.06-1.06l4.24 4.24a.75.75 0 0 1 0 1.06l-4.24 4.24a.75.75 0 0 1-1.08 0Z" clipRule="evenodd" />
                </svg>
              </button>

              <div className={`grid transition-all duration-200 ease-out ${expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                  <div className="ml-7 mt-1 space-y-1 border-l border-slate-200 pl-3">
                    {item.children?.map((child) => {
                      const childActive = isActivePath(location.pathname, child);
                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          onClick={() => {
                            setExpandedCategory(item.id);
                            setMobileOpen(false);
                          }}
                          className={`block rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                            childActive ? 'bg-primary-700 text-white shadow-sm shadow-primary-900/10' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                          }`}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-20 z-30 inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-lg shadow-slate-900/10 lg:hidden"
        aria-label="Open sidebar navigation"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16" />
          <path d="M4 12h16" />
          <path d="M4 18h16" />
        </svg>
      </button>

      <aside className="fixed left-0 top-16 z-30 hidden h-[calc(100vh-4rem)] w-64 border-r border-slate-200 bg-white shadow-xl shadow-slate-900/5 lg:block">
        {sidebarContent}
      </aside>

      <div className={`fixed inset-0 z-50 lg:hidden ${mobileOpen ? '' : 'pointer-events-none'}`}>
        <button
          type="button"
          aria-label="Close sidebar navigation"
          onClick={() => setMobileOpen(false)}
          className={`absolute inset-0 bg-slate-950/40 transition-opacity duration-200 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
        />
        <aside className={`relative h-full w-[min(20rem,86vw)] bg-white shadow-2xl shadow-slate-950/20 transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
            <div>
              <p className="text-sm font-black text-slate-950">Tanvox HRMS</p>
              <p className="text-xs font-medium text-slate-500">Navigation</p>
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600"
              aria-label="Close sidebar navigation"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
          <div className="h-[calc(100%-4rem)]">{sidebarContent}</div>
        </aside>
      </div>
    </>
  );
};

const isActivePath = (pathname, item) => {
  if (!item?.path) return false;
  if (item.exact) return pathname === item.path;
  return pathname === item.path || pathname.startsWith(`${item.path}/`);
};

export default Sidebar;
