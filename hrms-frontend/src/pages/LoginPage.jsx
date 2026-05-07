import React, { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const demoCredentials = [
  ['SUPER_ADMIN', 'superadmin@tanvox.local', 'Admin@12345'],
  ['ADMIN', 'admin@tanvox.local', 'Admin@12345'],
  ['HR', 'hr@tanvox.local', 'Hr@12345'],
  ['FINANCE', 'finance@tanvox.local', 'Finance@12345'],
];

const LoginPage = () => {
  const [email, setEmail] = useState('superadmin@tanvox.local');
  const [password, setPassword] = useState('Admin@12345');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const loginAbortRef = useRef(null);

  useEffect(() => () => {
    loginAbortRef.current?.abort();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setLocalError('');
    loginAbortRef.current?.abort();
    const controller = new AbortController();
    loginAbortRef.current = controller;
    try {
      const result = await login(email, password, { signal: controller.signal });
      navigate(result?.data?.user?.firstLogin ? '/change-password' : '/dashboard', { replace: true });
    } catch (error) {
      if (error.code === 'ERR_CANCELED') {
        setLocalError('Login request was cancelled. Please try again.');
        return;
      }
      const status = error.response?.status;
      const message = error.userMessage || error.response?.data?.message || error.message;
      if (status === 401 || status === 403) setLocalError(message || 'Invalid email or password.');
      else if (status === 502 || status === 503 || status === 504) setLocalError('The HRMS API is waking up or unavailable. Please try again in a moment.');
      else setLocalError(message || 'Unable to sign in. Please check your network and try again.');
    } finally {
      if (loginAbortRef.current === controller) {
        loginAbortRef.current = null;
      }
      setLoading(false);
    }
  };

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="login-stage">
      <div className="login-orb login-orb-one" />
      <div className="login-orb login-orb-two" />

      <div className="login-grid">
        <section className="login-brand-panel">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/15 text-sm font-black text-white ring-1 ring-white/25">TX</div>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-white/65">Tanvox</p>
              <h1 className="text-3xl font-black text-white">Enterprise Social HRMS</h1>
            </div>
          </div>

          <div className="mt-12 max-w-xl">
            <h2 className="text-5xl font-black leading-tight text-white">Where people ops feels alive.</h2>
            <p className="mt-5 text-base leading-7 text-white/75">
              A secure HRMS, CRM, project tracker, finance desk, and internal mail platform redesigned around a live company feed.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              ['Live Feed', 'Announcements, tasks, leads, and approvals in one stream.'],
              ['Role Aware', 'Permissions shape every action and every route.'],
              ['Enterprise Ready', 'Token-secured API integration with real workflows.'],
            ].map(([title, text]) => (
              <div key={title} className="rounded-lg border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <p className="font-black">{title}</p>
                <p className="mt-2 text-sm leading-6 text-white/70">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="login-card">
          <div className="mb-8">
            <p className="section-eyebrow">Secure sign in</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-500">Use your Tanvox workspace account to continue.</p>
          </div>

          {localError && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {localError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="login-field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="input-field"
                placeholder="name@tanvox.local"
                required
                autoComplete="email"
              />
            </label>

            <label className="login-field">
              <span>Password</span>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="input-field pr-24"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-3 py-1.5 text-xs font-black text-primary-700 transition hover:bg-primary-50"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            <button type="submit" disabled={loading} className="btn btn-primary h-12 w-full text-base">
              {loading && <span className="btn-spinner" />}
              {loading ? 'Signing in...' : 'Enter workspace'}
            </button>
          </form>

          <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50/80 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-black text-slate-950">Demo credentials</p>
              <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-black text-primary-700">Seeded</span>
            </div>
            <div className="grid gap-2">
              {demoCredentials.map(([role, demoEmail, demoPassword]) => (
                <button
                  key={role}
                  type="button"
                  className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-xs transition hover:border-primary-200 hover:bg-primary-50"
                  onClick={() => {
                    setEmail(demoEmail);
                    setPassword(demoPassword);
                    setLocalError('');
                  }}
                >
                  <span className="font-black text-slate-800">{role}</span>
                  <span className="text-slate-500">{demoEmail}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;
