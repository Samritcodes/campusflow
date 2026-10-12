import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatEventDateShort, formatTime12h, getGreeting } from '../../utils/date';

export default function OrganizerDashboard() {
  const { user, stats, announcements, refreshSession } = useAuth();
  const [events, setEvents] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Pass Verifier State
  const [passIdInput, setPassIdInput] = useState('CF-26-CSE-AI-00482');
  const [verifiedPass, setVerifiedPass] = useState(null);
  const [verifyError, setVerifyError] = useState(null);
  const [verifying, setVerifying] = useState(false);

  // Create Event Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    event_code: 'WORK',
    category: 'Workshop',
    department_id: user?.department_id || 1,
    venue: 'Seminar Hall 1',
    event_date: '2026-11-05',
    start_time: '10:00',
    end_time: '13:00',
    capacity: 100,
    registration_fee: 0,
    prize_pool: '',
    banner_url: '',
    description: '',
    agenda_text: '',
    rules_text: '',
    is_featured: false,
  });

  const loadData = useCallback(() => {
    const deptQuery =
      user?.role !== 'ADMIN' && user?.department_code
        ? `?department=${encodeURIComponent(user.department_code)}`
        : '';
    apiRequest(`/events/index.php${deptQuery}`)
      .then((res) => setEvents(res.data?.events || []))
      .catch(() => {});
    apiRequest('/auth/departments.php')
      .then((res) => setDepartments(res.data?.departments || []))
      .catch(() => {});
  }, [user?.role, user?.department_code]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleVerifyPass = async (e, action = 'lookup') => {
    if (e) e.preventDefault();
    setVerifying(true);
    setVerifyError(null);
    if (action === 'lookup') setVerifiedPass(null);
    try {
      const res = await apiRequest('/registrations/verify.php', {
        method: 'POST',
        body: { pass_id: passIdInput, action },
      });
      setVerifiedPass(res.data?.pass || null);
    } catch (err) {
      setVerifyError(err.message);
      setVerifiedPass(null);
    } finally {
      setVerifying(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setCreatingEvent(true);
    try {
      await apiRequest('/events/create.php', {
        method: 'POST',
        body: eventForm,
      });
      setShowCreateModal(false);
      await refreshSession();
      loadData();
    } catch {
      // handled
    } finally {
      setCreatingEvent(false);
    }
  };

  const firstName = user?.full_name?.split(' ')[0] || 'Organizer';
  const roleTitle =
    user?.role === 'DEPARTMENT_MANAGER' ? 'Department Manager' : 'Event Organizer';

  return (
    <div className="space-y-12">
      <header className="border-b border-[var(--cf-border)] pb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono-code uppercase tracking-widest text-[var(--cf-primary)]">
            {roleTitle} · {user?.department_name || 'Campus'}
          </p>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[var(--cf-text)] mt-1">
            {getGreeting()}, {firstName}
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="font-editorial text-3xl text-[var(--cf-text)]">
              {stats?.upcoming_events ?? events.length}
            </p>
            <p className="text-[11px] font-mono-code uppercase text-[var(--cf-text-secondary)]">
              Active Events
            </p>
          </div>
          <div className="pl-6 border-l border-[var(--cf-border)] text-right">
            <p className="font-editorial text-3xl text-[var(--cf-text)]">
              {stats?.total_registrations ?? 0}
            </p>
            <p className="text-[11px] font-mono-code uppercase text-[var(--cf-text-secondary)]">
              Passes Issued
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md bg-[var(--cf-primary)] hover:bg-[var(--cf-primary-hover)] text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Publish event
          </button>
        </div>
      </header>

      {/* Live Pass Verification & Attendance Check-In */}
      <section className="rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <p className="text-xs font-mono-code font-semibold uppercase tracking-widest text-[var(--cf-primary)]">
              ENTRY DESK · PASS VERIFICATION
            </p>
            <h2 className="font-editorial text-2xl text-[var(--cf-text)] mt-0.5">
              Verify participant pass & mark attendance
            </h2>
          </div>

          <form onSubmit={(e) => handleVerifyPass(e, 'lookup')} className="flex items-center gap-2">
            <input
              type="text"
              value={passIdInput}
              onChange={(e) => setPassIdInput(e.target.value.toUpperCase())}
              placeholder="CF-26-CSE-AI-00482"
              className="px-3.5 py-2 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)] font-mono-code text-xs text-[var(--cf-text)] w-56 focus:outline-none focus:border-[var(--cf-primary)]"
            />
            <button
              type="submit"
              disabled={verifying}
              className="px-4 py-2 rounded-md bg-[var(--cf-text)] text-[var(--cf-bg)] text-xs font-semibold cursor-pointer"
            >
              {verifying ? 'Checking...' : 'Verify Pass'}
            </button>
          </form>
        </div>

        {verifyError && (
          <div className="p-4 rounded-md border border-rose-500/30 bg-rose-500/10 text-rose-600 flex items-center gap-2.5 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{verifyError}</span>
          </div>
        )}

        {verifiedPass && (
          <div className="p-5 rounded-md border border-[#059669]/40 bg-[#059669]/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                <span className="font-mono-code text-xs font-bold text-[#059669]">
                  VALID PASS · {verifiedPass.pass_id}
                </span>
                <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-[var(--cf-surface)] border border-[var(--cf-border)]">
                  {verifiedPass.status}
                </span>
                <span className="text-[11px] font-mono-code font-bold px-2 py-0.5 rounded bg-[#059669]/10 text-[#059669] border border-[#059669]/30">
                  {Number(verifiedPass.amount_paid || 0) > 0
                    ? `${verifiedPass.payment_status} · ₹${Number(verifiedPass.amount_paid)} (${verifiedPass.transaction_id || verifiedPass.payment_method})`
                    : 'FREE ENTRY'}
                </span>
              </div>
              <p className="text-base font-bold text-[var(--cf-text)]">
                {verifiedPass.student_name}{' '}
                <span className="text-xs font-normal text-[var(--cf-text-secondary)]">
                  ({verifiedPass.student_department_code} · {verifiedPass.year_of_study})
                </span>
              </p>
              <p className="text-xs text-[var(--cf-text-secondary)]">
                Event: <strong className="text-[var(--cf-text)]">{verifiedPass.event_title}</strong> · {verifiedPass.venue}
              </p>
            </div>

            {verifiedPass.status !== 'ATTENDED' && verifiedPass.status !== 'CANCELLED' ? (
              <button
                type="button"
                disabled={verifying}
                onClick={(e) => handleVerifyPass(e, 'mark_attended')}
                className="px-4 py-2.5 rounded-md bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold transition-colors cursor-pointer shrink-0"
              >
                Mark as Attended ✓
              </button>
            ) : (
              <span className="font-mono-code text-xs font-semibold text-[#059669]">
                Attendance Recorded ✓
              </span>
            )}
          </div>
        )}
      </section>

      {/* Editorial Schedule Table */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-mono-code font-semibold uppercase tracking-widest text-[var(--cf-text-secondary)]">
            CAMPUS EVENT ROSTER ({events.length})
          </h2>
        </div>

        <div className="rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--cf-border)] text-[11px] font-mono-code uppercase text-[var(--cf-text-secondary)] bg-[var(--cf-bg)]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Event</th>
                <th className="py-3 px-4">Dept</th>
                <th className="py-3 px-4">Entry & Rewards</th>
                <th className="py-3 px-4">Venue</th>
                <th className="py-3 px-4 text-right">Registrations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--cf-border)] text-sm">
              {events.map((ev) => (
                <tr key={ev.id} className="hover:bg-[var(--cf-surface-muted)]/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono-code text-xs text-[var(--cf-primary)] whitespace-nowrap">
                    {formatEventDateShort(ev.event_date)} · {formatTime12h(ev.start_time)}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-[var(--cf-text)]">
                    <Link to={`/organizer/events/${ev.slug}`} className="hover:text-[var(--cf-primary)]">
                      {ev.title}
                    </Link>
                  </td>
                  <td className="py-3.5 px-4 font-mono-code text-xs text-[var(--cf-text-secondary)]">
                    {ev.department_code}
                  </td>
                  <td className="py-3.5 px-4 font-mono-code text-xs">
                    <span className="font-bold text-[var(--cf-text)]">
                      {Number(ev.registration_fee || 0) > 0 ? `₹${ev.registration_fee}` : 'FREE'}
                    </span>
                    {ev.prize_pool && (
                      <span className="block text-[11px] font-sans text-[#059669]">
                        {ev.prize_pool}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-[var(--cf-text-secondary)]">
                    {ev.venue}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono-code text-xs">
                    <span className="font-semibold text-[var(--cf-text)]">{ev.registered_count}</span>
                    <span className="text-[var(--cf-text-secondary)]"> / {ev.capacity}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bulletins */}
      <section>
        <h2 className="text-xs font-mono-code font-semibold uppercase tracking-widest text-[var(--cf-text-secondary)] mb-4">
          RECENT ANNOUNCEMENTS
        </h2>
        <div className="rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] divide-y divide-[var(--cf-border)]">
          {announcements.map((ann) => (
            <div key={ann.id} className="p-4 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-mono-code text-[var(--cf-primary)]">
                  <span>{ann.priority}</span>
                  <span>·</span>
                  <span className="text-[var(--cf-text-secondary)]">{ann.author_name}</span>
                </div>
                <h3 className="text-sm font-bold text-[var(--cf-text)] mt-1">{ann.title}</h3>
                <p className="text-xs text-[var(--cf-text-secondary)] mt-1">{ann.message}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--cf-border)] pb-3">
              <h3 className="font-editorial text-2xl text-[var(--cf-text)]">Publish new campus event</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-xs text-[var(--cf-text-secondary)] hover:text-[var(--cf-text)] cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="e.g. Cloud Native & Kubernetes Workshop"
                  className="w-full px-3 py-2 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Category</label>
                  <select
                    value={eventForm.category}
                    onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)]"
                  >
                    <option value="Workshop">Workshop</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Tech Talk">Tech Talk</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Pass Code</label>
                  <input
                    type="text"
                    maxLength={8}
                    value={eventForm.event_code}
                    onChange={(e) => setEventForm({ ...eventForm, event_code: e.target.value.toUpperCase() })}
                    placeholder="CLOUD"
                    className="w-full px-3 py-2 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)] font-mono-code"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Department</label>
                  <select
                    value={eventForm.department_id}
                    onChange={(e) => setEventForm({ ...eventForm, department_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)]"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.code}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Venue</label>
                  <input
                    type="text"
                    required
                    value={eventForm.venue}
                    onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                    className="w-full px-3 py-2 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Capacity</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={eventForm.capacity}
                    onChange={(e) => setEventForm({ ...eventForm, capacity: e.target.value })}
                    className="w-full px-3 py-2 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Entry Fee (₹, 0 = Free)</label>
                  <input
                    type="number"
                    min={0}
                    step="1"
                    value={eventForm.registration_fee}
                    onChange={(e) => setEventForm({ ...eventForm, registration_fee: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)] font-mono-code"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Prize Pool / Rewards (Optional)</label>
                  <input
                    type="text"
                    value={eventForm.prize_pool}
                    onChange={(e) => setEventForm({ ...eventForm, prize_pool: e.target.value })}
                    placeholder="e.g. ₹50,000 + Internships"
                    className="w-full px-3 py-2 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={eventForm.event_date}
                    onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={eventForm.start_time}
                    onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={eventForm.end_time}
                    onChange={(e) => setEventForm({ ...eventForm, end_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Event Schedule & Itinerary (Optional, one slot per line)
                </label>
                <textarea
                  rows={3}
                  value={eventForm.agenda_text}
                  onChange={(e) => setEventForm({ ...eventForm, agenda_text: e.target.value })}
                  placeholder="• 10:00 AM — Opening & Registration&#10;• 11:00 AM — Technical Session"
                  className="w-full px-3 py-2 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)] font-mono-code text-[11px]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Rules & Eligibility Guidelines (Optional, one rule per line)
                </label>
                <textarea
                  rows={2}
                  value={eventForm.rules_text}
                  onChange={(e) => setEventForm({ ...eventForm, rules_text: e.target.value })}
                  placeholder="• Open to all departments&#10;• Carry valid university ID card"
                  className="w-full px-3 py-2 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)] font-mono-code text-[11px]"
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
                  disabled={creatingEvent}
                  className="px-4 py-2 rounded-md bg-[var(--cf-primary)] text-white font-semibold cursor-pointer"
                >
                  {creatingEvent ? 'Publishing...' : 'Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
