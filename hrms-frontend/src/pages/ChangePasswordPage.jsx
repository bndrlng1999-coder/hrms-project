import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../hooks/useNotification';

const ChangePasswordPage = () => {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showError, showSuccess } = useNotification();

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    try {
      setLoading(true);
      await authAPI.changePassword(form);
      showSuccess('Password changed. Please login again.');
      logout();
      navigate('/login');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell max-w-xl">
      <p className="section-eyebrow">Account verification</p>
      <h1 className="mb-2 text-3xl font-bold text-slate-950">Change temporary password</h1>
      <p className="mb-6 text-sm text-slate-500">{user?.email} must set a permanent password before continuing.</p>
      <form className="card space-y-4" onSubmit={submit}>
        <input className="input-field" type="password" placeholder="Temporary password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} required />
        <input className="input-field" type="password" placeholder="New password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} required />
        <input className="input-field" type="password" placeholder="Confirm new password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
        <button className="btn btn-primary w-full" disabled={loading}>{loading ? 'Saving...' : 'Save password'}</button>
      </form>
    </div>
  );
};

export default ChangePasswordPage;
