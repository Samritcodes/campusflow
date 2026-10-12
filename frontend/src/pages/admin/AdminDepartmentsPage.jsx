import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { formatEventDateShort, formatTime12h } from '../../utils/date';

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCode, setSelectedCode] = useState('ALL');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ code: '', name: '', description: '' });

  const loadDepartments = useCallback(() => {
    setLoading(true);
    apiRequest('/departments/overview.php')
      .then((res) => setDepartments(res.data?.departments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await apiRequest('/departments/create.php', {
        method: 'POST',
        body: form,
      });
      setForm({ code: '', name: '', description: '' });
      setShowCreateModal(false);
      loadDepartments();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const visibleDepartments =
    selectedCode === 'ALL'
      ? departments
      : departments.filter((d) => d.code === selectedCode);

  return (
    <div className="space-y-10">
      <header className="border-b border-[var(--cf-border)] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono-code uppercase tracking-widest text-[var(--cf-primary)]">
            SYSTEM ADMINISTRATION · ALL ACADEMIC & CULTURAL UNITS
          </p>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[var(--cf-text)] mt-1">
            Campus departments registry
          </h1>
          <p className="text-sm text-[var(--cf-text-secondary)] mt-1.5 max-w-2xl">
            System-wide view of all academic departments, student councils, assigned department managers, and event volume.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md bg-[var(--cf-primary)] hover:bg-[var(--cf-primary-hover)] text-white text-xs font-semibold transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> Add department
        </button>
      </header>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setSelectedCode('ALL')}
          className={`px-3 py-1.5 rounded-md text-xs font-mono-code transition-colors cursor-pointer ${
            selectedCode === 'ALL'
              ? 'bg-[var(--cf-text)] text-[var(--cf-bg)] font-semibold'
              : 'border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-secondary)] hover:text-[var(--cf-text)]'
          }`}
        >
          ALL DEPARTMENTS ({departments.length})
        </button>
        {departments.map((dept) => (
          <button
            key={dept.code}
            onClick={() => setSelectedCode(dept.code)}
            className={`px-3 py-1.5 rounded-md text-xs font-mono-code transition-colors cursor-pointer ${
              selectedCode === dept.code
                ? 'bg-[var(--cf-text)] text-[var(--cf-bg)] font-semibold'
                : 'border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-secondary)] hover:text-[var(--cf-text)]'
            }`}
          >
            {dept.code}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-[var(--cf-text-secondary)]">Loading departments...</p>
      ) : (
        <div className="space-y-6">
          {visibleDepartments.map((dept) => (
            <section
              key={dept.id}
              className="rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] overflow-hidden"
            >
              <div className="p-6 border-b border-[var(--cf-border)] flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono-code text-xs font-bold px-2.5 py-0.5 rounded bg-[var(--cf-primary)]/10 text-[var(--cf-primary)]">
                      {dept.code}
                    </span>
                    <span className="text-xs text-[var(--cf-text-secondary)]">
                      Lead:{' '}
                      <strong className="text-[var(--cf-text)]">
                        {dept.lead_name || 'Unassigned'}
                      </strong>
                    </span>
                  </div>
                  <h2 className="font-editorial text-2xl sm:text-3xl text-[var(--cf-text)]">
                    {dept.name}
                  </h2>
                  <p className="text-xs text-[var(--cf-text-secondary)] leading-relaxed">
                    {dept.description}
                  </p>
                </div>

                <div className="flex items-center gap-6 shrink-0 border-t md:border-t-0 pt-4 md:pt-0 border-[var(--cf-border)]">
                  <div>
                    <p className="font-mono-code text-lg font-bold text-[var(--cf-text)]">
                      {dept.student_count}
                    </p>
                    <p className="text-[10px] font-mono-code uppercase text-[var(--cf-text-secondary)]">
                      Students
                    </p>
                  </div>
                  <div className="pl-6 border-l border-[var(--cf-border)]">
                    <p className="font-mono-code text-lg font-bold text-[var(--cf-text)]">
                      {dept.event_count}
                    </p>
                    <p className="text-[10px] font-mono-code uppercase text-[var(--cf-text-secondary)]">
                      Events
                    </p>
                  </div>
                  <div className="pl-6 border-l border-[var(--cf-border)]">
                    <p className="font-mono-code text-lg font-bold text-[var(--cf-text)]">
                      {dept.total_registrations}
                    </p>
                    <p className="text-[10px] font-mono-code uppercase text-[var(--cf-text-secondary)]">
                      Registrations
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--cf-bg)] px-6 py-4">
                <p className="text-[10px] font-mono-code uppercase tracking-wider text-[var(--cf-text-secondary)] mb-3">
                  SCHEDULED IN {dept.code}
                </p>
                {dept.events.length === 0 ? (
                  <p className="text-xs text-[var(--cf-text-secondary)] py-1">
                    No events scheduled in {dept.code}.
                  </p>
                ) : (
                  <div className="divide-y divide-[var(--cf-border)]">
                    {dept.events.map((ev) => (
                      <div
                        key={ev.id}
                        className="py-2.5 flex items-center justify-between gap-4 text-xs"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <span className="font-mono-code text-[var(--cf-primary)] font-semibold shrink-0 w-32">
                            {formatEventDateShort(ev.event_date)} · {formatTime12h(ev.start_time)}
                          </span>
                          <Link
                            to={`/admin/events/${ev.slug}`}
                            className="font-bold text-sm text-[var(--cf-text)] hover:text-[var(--cf-primary)] truncate"
                          >
                            {ev.title}
                          </Link>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <span className="text-[var(--cf-text-secondary)] hidden sm:inline">
                            {ev.venue}
                          </span>
                          <span className="font-mono-code text-[var(--cf-text-secondary)]">
                            {ev.registered_count}/{ev.capacity}
                          </span>
                          <Link
                            to={`/admin/events/${ev.slug}`}
                            className="font-semibold text-[var(--cf-primary)] hover:underline"
                          >
                            View →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] p-6 space-y-4">
            <h3 className="font-editorial text-2xl text-[var(--cf-text)]">Add campus department</h3>
            {error && (
              <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs">
                {error}
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Department Code</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="e.g. MBA, CIVIL, EEE"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)] font-mono-code"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Full Department Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Civil & Environmental Engineering"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)]"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-md border border-[var(--cf-border)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-md bg-[var(--cf-primary)] text-white font-semibold cursor-pointer"
                >
                  {creating ? 'Creating...' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
