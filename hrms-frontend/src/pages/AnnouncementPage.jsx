import React, { useState, useEffect } from 'react';
import { announcementAPI } from '../services/api';
import { PERMISSIONS, hasPermission } from '../auth/authorization';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../hooks/useNotification';

const AnnouncementPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });
  const { user } = useAuth();
  const { showError, showSuccess } = useNotification();
  const canCreate = hasPermission(user, [PERMISSIONS.ANNOUNCEMENT_CREATE]);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await announcementAPI.getAll();
      setAnnouncements(res.data.data || []);
    } catch (error) {
      showError('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const createAnnouncement = async (e) => {
    e.preventDefault();
    if (submitting) return;
    try {
      setSubmitting(true);
      const res = await announcementAPI.create(form);
      setAnnouncements((current) => [res.data.data, ...current]);
      setForm({ title: '', content: '' });
      showSuccess('Announcement created');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to create announcement');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading announcements...</div>;

  return (
    <div className="page-shell">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Announcements</h1>

      {canCreate && (
        <div className="card mb-8">
          <h2 className="mb-4 text-xl font-bold text-slate-950">Create Announcement</h2>
          <form onSubmit={createAnnouncement} className="space-y-4">
            <input
              className="input-field"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Title"
              required
            />
            <textarea
              className="input-field min-h-[120px]"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Announcement details"
              required
            />
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? <span className="btn-spinner" /> : null}
              Publish
            </button>
          </form>
        </div>
      )}

      {announcements.length === 0 ? (
        <div className="card">
          <div className="text-center py-8 text-gray-500">No announcements yet</div>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{announcement.title}</h2>
              <p className="text-gray-600 mb-4">{announcement.content}</p>
              <div className="text-sm text-gray-500">
                Posted on: {new Date(announcement.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnnouncementPage;
