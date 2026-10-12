import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatEventDateShort } from '../../utils/date';

export default function AdminDashboard() {
  const { user, stats } = useAuth();
  const [events, setEvents] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    apiRequest('/events/index.php')
      .then((res) => setEvents(res.data?.events || []))
      .catch(() => {});
    apiRequest('/auth/departments.php')
      .then((res) => setDepartments(res.data?.departments || []))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-12">
      <header className="border-b border-[var(--cf-border)] pb-8">
        <p className="text-xs font-mono-code uppercase tracking-widest text-[var(--cf-primary)]">
          UNIVERSITY ADMINISTRATION · {user?.full_name}
        </p>
        <h1 className="font-editorial text-4xl sm:text-5xl text-[var(--cf-text)] mt-1">
          Campus overview
        </h1>

        <div className="mt-8 pt-6 border-t border-[var(--cf-border)] grid grid-cols-2 sm:grid-cols-4 gap-8">
          <div>
            <p className="font-editorial text-4xl text-[var(--cf-text)]">
              {stats?.departments ?? departments.length}
            </p>
            <p className="text-xs font-mono-code uppercase text-[var(--cf-text-secondary)] mt-1">
              Departments
            </p>
          </div>
          <div>
            <p className="font-editorial text-4xl text-[var(--cf-text)]">
              {stats?.upcoming_events ?? events.length}
            </p>
            <p className="text-xs font-mono-code uppercase text-[var(--cf-text-secondary)] mt-1">
              Active Events
            </p>
          </div>
          <div>
            <p className="font-editorial text-4xl text-[var(--cf-text)]">
              {stats?.total_users ?? 0}
            </p>
            <p className="text-xs font-mono-code uppercase text-[var(--cf-text-secondary)] mt-1">
              Registered Accounts
            </p>
          </div>
          <div>
            <p className="font-editorial text-4xl text-[var(--cf-text)]">
              {stats?.total_registrations ?? 0}
            </p>
            <p className="text-xs font-mono-code uppercase text-[var(--cf-text-secondary)] mt-1">
              Issued Passes
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Events Directory */}
        <section className="lg:col-span-8">
          <h2 className="text-xs font-mono-code font-semibold uppercase tracking-widest text-[var(--cf-text-secondary)] mb-4">
            ALL CAMPUS EVENTS
          </h2>
          <div className="rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] divide-y divide-[var(--cf-border)]">
            {events.map((ev) => (
              <div key={ev.id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono-code text-[var(--cf-primary)]">
                    <span>{formatEventDateShort(ev.event_date)}</span>
                    <span>·</span>
                    <span>{ev.department_code}</span>
                    <span>·</span>
                    <span className="text-[var(--cf-text-secondary)]">{ev.category}</span>
                    <span>·</span>
                    <span className="font-bold text-[var(--cf-text)]">
                      {Number(ev.registration_fee || 0) > 0 ? `₹${ev.registration_fee}` : 'FREE'}
                    </span>
                    {ev.prize_pool && (
                      <span className="text-[#059669] font-sans font-semibold">
                        · 🏆 {ev.prize_pool}
                      </span>
                    )}
                  </div>
                  <Link
                    to={`/admin/events/${ev.slug}`}
                    className="text-sm font-bold text-[var(--cf-text)] hover:text-[var(--cf-primary)] block mt-0.5 truncate"
                  >
                    {ev.title}
                  </Link>
                  <p className="text-xs text-[var(--cf-text-secondary)]">
                    Organizer: {ev.organizer_name} · {ev.venue}
                  </p>
                </div>
                <div className="text-right font-mono-code text-xs shrink-0">
                  <p className="font-semibold text-[var(--cf-text)]">
                    {ev.registered_count} / {ev.capacity}
                  </p>
                  <p className="text-[11px] text-[var(--cf-text-secondary)]">registered</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Academic Departments */}
        <section className="lg:col-span-4">
          <h2 className="text-xs font-mono-code font-semibold uppercase tracking-widest text-[var(--cf-text-secondary)] mb-4">
            DEPARTMENTS
          </h2>
          <div className="rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] divide-y divide-[var(--cf-border)]">
            {departments.map((dept) => (
              <div key={dept.id} className="p-4">
                <span className="font-mono-code text-xs font-bold text-[var(--cf-primary)]">{dept.code}</span>
                <h3 className="text-sm font-semibold text-[var(--cf-text)] mt-0.5">{dept.name}</h3>
                <p className="text-xs text-[var(--cf-text-secondary)] mt-1">{dept.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
