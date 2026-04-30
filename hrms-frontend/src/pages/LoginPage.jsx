import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../hooks/useNotification';

const LoginPage = () => {
  const [email, setEmail] = useState('superadmin@tanvox.local');
  const [password, setPassword] = useState('Admin@12345');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const { showError, showSuccess } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const result = await login(email, password);
      showSuccess('Login successful!');
      navigate(result?.data?.user?.firstLogin ? '/change-password' : '/dashboard');
    } catch (error) {
      showError(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-surface px-4 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden lg:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary-900 text-sm font-black text-white">TX</div>
            <div>
              <h1 className="text-2xl font-bold text-slate-950">Tanvox HRMS</h1>
              <p className="text-sm text-slate-500">Enterprise people operations suite</p>
            </div>
          </div>
          <div className="grid gap-4">
            {['People, payroll, attendance, and leave in one secure workspace', 'Permission-aware project tracker and internal mail', 'Executive dashboards with operational visibility'].map((item) => (
              <div key={item} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-800">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="w-full">
        <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/80">
          <div className="mb-8">
            <p className="section-eyebrow">Secure sign in</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">Welcome back</h1>
            <p className="mt-2 text-sm text-slate-500">Use your Tanvox account to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-8 rounded-lg border border-primary-100 bg-primary-50 p-4">
            <p className="text-sm font-semibold text-primary-900 mb-2">Test Credentials</p>
            <p className="text-sm text-primary-800">SUPER_ADMIN: superadmin@tanvox.local / Admin@12345</p>
            <p className="text-sm text-primary-800">ADMIN: admin@tanvox.local / Admin@12345</p>
            <p className="text-sm text-primary-800">HR: hr@tanvox.local / Hr@12345</p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
