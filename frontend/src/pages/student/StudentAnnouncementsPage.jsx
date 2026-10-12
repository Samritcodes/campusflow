import { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function StudentAnnouncementsPage() {
  const { user, refreshSession } = useAuth();
  const location = useLocation();
  const [announcements, setAnnouncements] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const isStaff =
    user && ['ADMIN', 'DEPARTMENT_MANAGER', 'ORGANIZER'].includes(user.role);
  const isAdmin = user?.role === 'ADMIN';

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [form, setForm] = useState({
    title: '',
    message: '',
    priority: 'IMPORTANT',
    department_id: isAdmin ? '' : user?.department_id || '',
  });

  const loadAnnouncements = useCallback(() => {
    setLoading(true);
    apiRequest('/announcements/index.php')
      .then((res) => setAnnouncements(res.data?.announcements || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadAnnouncements();
    if (isStaff) {
      apiRequest('/auth/departments.php')
        .then((res) => setDepartments(res.data?.departments || []))
        .catch(() => {});
    }
  }, [loadAnnouncements, isStaff]);

  const handlePublish = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await apiRequest('/announcements/create.php', {
        method: 'POST',
        body: {
          title: form.title,
          message: form.message,
          priority: form.priority,
          department_id: isAdmin
            ? form.department_id || null
            : user?.department_id || null,
        },
      });
      setShowCreateModal(false);
      setForm({
        title: '',
        message: '',
        priority: 'IMPORTANT',
        department_id: isAdmin ? '' : user?.department_id || '',
      });
      setFeedback({ type: 'success', text: res.message });
      await refreshSession();
      loadAnnouncements();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Scope announcements for non-admin users to Campus-Wide + their own department
  const visibleAnnouncements = isAdmin
    ? announcements
    : announcements.filter(
        (ann) => !ann.department_code || ann.department_code === user?.department_code
      );

  const eventPrefix = location.pathname.startsWith('/admin')
    ? '/admin/events'
    : location.pathname.startsWith('/organizer')
    ? '/organizer/events'
    : '/student/events';

  return (
    <div className="space-y-8">
      <header className="border-b border-[var(--cf-border)] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono-code uppercase tracking-widest text-[var(--cf-primary)]">
            CAMPUS COMMUNICATIONS
          </p>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[var(--cf-text)] mt-1">
            Announcements & bulletins
          </h1>
        </div>

        {isStaff && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md bg-[var(--cf-primary)] hover:bg-[var(--cf-primary-hover)] text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Announcement
          </button>
        )}
      </header>

      {feedback && (
        <div
          className={`p-4 rounded-md border text-xs font-medium ${
            feedback.type === 'success'
              ? 'border-[#059669]/30 bg-[#059669]/10 text-[#059669]'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-600'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-[var(--cf-text-secondary)]">Loading bulletins...</p>
      ) : visibleAnnouncements.length === 0 ? (
        <div className="p-8 rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] text-center text-xs text-[var(--cf-text-secondary)]">
          No announcements published yet.
        </div>
      ) : (
        <div className="rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] divide-y divide-[var(--cf-border)]">
          {visibleAnnouncements.map((ann) => (
            <article key={ann.id} className="p-6 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono-code">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded font-semibold ${
                      ann.priority === 'URGENT'
                        ? 'bg-rose-500/10 text-rose-600'
                        : ann.priority === 'IMPORTANT'
                        ? 'bg-[var(--cf-primary)]/10 text-[var(--cf-primary)]'
                        : 'bg-[var(--cf-surface-muted)] text-[var(--cf-text-secondary)]'
                    }`}
                  >
                    {ann.priority}
                  </span>
                  <span className="text-[var(--cf-text-secondary)]">
                    {ann.department_code ? `${ann.department_code} DEPT` : 'CAMPUS-WIDE'}
                  </span>
                </div>
                <span className="text-[var(--cf-text-secondary)]">
                  By {ann.author_name}
                </span>
              </div>

              <h2 className="text-lg font-bold text-[var(--cf-text)]">{ann.title}</h2>
              <p className="text-sm text-[var(--cf-text-secondary)] leading-relaxed">
                {ann.message}
              </p>

              {ann.event_title && (
                <div className="pt-2">
                  <Link
                    to={`${eventPrefix}/${ann.event_slug}`}
                    className="text-xs font-semibold text-[var(--cf-primary)] hover:underline"
                  >
                    Related event: {ann.event_title} →
                  </Link>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* Standalone Announcement Publisher Modal (Stage A) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--cf-border)] pb-3">
              <h3 className="font-editorial text-2xl text-[var(--cf-text)]">
                Publish campus bulletin
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-[var(--cf-text-secondary)] hover:text-[var(--cf-text)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePublish} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Headline</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Lab Schedule & Registration Deadline Extended"
                  className="w-full px-3 py-2 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)] font-mono-code"
                  >
                    <option value="NORMAL">NORMAL</option>
                    <option value="IMPORTANT">IMPORTANT</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Target Audience</label>
                  {isAdmin ? (
                    <select
                      value={form.department_id}
                      onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                      className="w-full px-3 py-2 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)]"
                    >
                      <option value="">Campus-Wide (All Depts)</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.code} — {d.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      disabled
                      value={`${user?.department_code || 'Department'} Dept`}
                      className="w-full px-3 py-2 rounded-md bg-[var(--cf-surface-muted)] border border-[var(--cf-border)] font-mono-code text-[var(--cf-text-secondary)]"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Bulletin Message</label>
                <textarea
                  rows={4}
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Write announcement details for students and faculty..."
                  className="w-full px-3 py-2 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-md border border-[var(--cf-border)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-md bg-[var(--cf-primary)] text-white font-semibold cursor-pointer"
                >
                  {submitting ? 'Publishing...' : 'Publish Bulletin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
