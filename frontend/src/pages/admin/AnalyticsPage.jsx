import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Star, TrendingUp, ShieldCheck, Users } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatEventDateShort } from '../../utils/date';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'ADMIN';
  const eventLinkPrefix = location.pathname.startsWith('/admin')
    ? '/admin/events'
    : '/organizer/events';

  useEffect(() => {
    setLoading(true);
    apiRequest('/analytics/summary.php')
      .then((res) => setData(res.data || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-12 text-sm text-[var(--cf-text-secondary)]">
        Computing campus analytics & conversion metrics...
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const byDepartment = data?.by_department || [];
  const byCategory = data?.by_category || [];
  const eventsPerformance = data?.events_performance || [];

  return (
    <div className="space-y-12">
      <header className="border-b border-[var(--cf-border)] pb-8">
        <p className="text-xs font-mono-code uppercase tracking-widest text-[var(--cf-primary)]">
          {isAdmin
            ? 'CAMPUS-WIDE INTELLIGENCE · ALL DEPARTMENTS'
            : `DEPARTMENT ANALYTICS · ${user?.department_name || user?.department_code}`}
        </p>
        <h1 className="font-editorial text-4xl sm:text-5xl text-[var(--cf-text)] mt-1">
          Analytics, fill rates & revenue insights
        </h1>

        {/* KPI Strip */}
        <div className="mt-8 pt-6 border-t border-[var(--cf-border)] grid grid-cols-2 sm:grid-cols-5 gap-6">
          <div>
            <p className="font-editorial text-4xl text-[var(--cf-text)]">
              {kpis.fill_rate_pct ?? 0}%
            </p>
            <p className="text-[11px] font-mono-code uppercase text-[var(--cf-text-secondary)] mt-1">
              Seat Fill Rate ({kpis.total_registered}/{kpis.total_capacity})
            </p>
          </div>

          <div>
            <p className="font-editorial text-4xl text-[var(--cf-text)]">
              {kpis.total_registered ?? 0}
            </p>
            <p className="text-[11px] font-mono-code uppercase text-[var(--cf-text-secondary)] mt-1">
              Confirmed Passes
            </p>
          </div>

          <div>
            <p className="font-editorial text-4xl text-[#059669]">
              {kpis.total_attended ?? 0}
            </p>
            <p className="text-[11px] font-mono-code uppercase text-[var(--cf-text-secondary)] mt-1">
              Verified Attended ({kpis.attendance_conversion_pct ?? 0}%)
            </p>
          </div>

          <div>
            <p className="font-editorial text-4xl text-[var(--cf-primary)]">
              ₹{Number(kpis.total_revenue || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] font-mono-code uppercase text-[var(--cf-text-secondary)] mt-1">
              Gateway Ticket Revenue
            </p>
          </div>

          <div>
            <p className="font-editorial text-4xl text-amber-500">
              ★ {kpis.avg_rating ?? '5.0'}
            </p>
            <p className="text-[11px] font-mono-code uppercase text-[var(--cf-text-secondary)] mt-1">
              Avg Participant Rating
            </p>
          </div>
        </div>
      </header>

      {/* Two-Column Breakdown: Department Fill Rates + Category Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono-code font-semibold uppercase tracking-widest text-[var(--cf-text-secondary)]">
              DEPARTMENT REGISTRATION & REVENUE BREAKDOWN
            </h2>
            <TrendingUp className="w-4 h-4 text-[var(--cf-primary)]" />
          </div>

          <div className="rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] divide-y divide-[var(--cf-border)]">
            {byDepartment.map((dept) => {
              const cap = Math.max(1, Number(dept.capacity || 1));
              const reg = Number(dept.registered || 0);
              const pct = Math.min(100, Math.round((reg / cap) * 100));
              return (
                <div key={dept.id} className="p-5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono-code font-bold text-[var(--cf-primary)] mr-2">
                        {dept.code}
                      </span>
                      <span className="font-semibold text-[var(--cf-text)]">{dept.name}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono-code">
                      <span className="text-[#059669] font-semibold">
                        ₹{Number(dept.revenue || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[var(--cf-text)] font-bold">
                        {reg} / {dept.capacity} seats ({pct}%)
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-2 rounded-full bg-[var(--cf-bg)] border border-[var(--cf-border)] overflow-hidden">
                    <div
                      className="h-full bg-[var(--cf-primary)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono-code text-[var(--cf-text-secondary)]">
                    <span>{dept.event_count} active events</span>
                    <span>{dept.attended} verified check-ins</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono-code font-semibold uppercase tracking-widest text-[var(--cf-text-secondary)]">
              DEMAND BY CATEGORY
            </h2>
            <Users className="w-4 h-4 text-[var(--cf-primary)]" />
          </div>

          <div className="rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] divide-y divide-[var(--cf-border)]">
            {byCategory.map((cat) => {
              const cap = Math.max(1, Number(cat.capacity || 1));
              const reg = Number(cat.registered || 0);
              const pct = Math.min(100, Math.round((reg / cap) * 100));
              return (
                <div key={cat.category} className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[var(--cf-text)]">{cat.category}</span>
                    <span className="font-mono-code text-[var(--cf-text-secondary)]">
                      {cat.event_count} events · <strong className="text-[var(--cf-text)]">{pct}% fill</strong>
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[var(--cf-bg)] overflow-hidden">
                    <div
                      className="h-full bg-[#059669]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Event-by-Event Conversion & Revenue Table */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono-code font-semibold uppercase tracking-widest text-[var(--cf-text-secondary)]">
            EVENT CONVERSION, FILL RATE & TICKET REVENUE LEADERBOARD
          </h2>
          <span className="inline-flex items-center gap-1 text-xs font-mono-code text-[#059669]">
            <ShieldCheck className="w-3.5 h-3.5" /> Live MySQL Ledger
          </span>
        </div>

        <div className="rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--cf-border)] bg-[var(--cf-bg)] font-mono-code text-[10px] uppercase text-[var(--cf-text-secondary)]">
                <th className="py-3 px-4">Event</th>
                <th className="py-3 px-4">Dept</th>
                <th className="py-3 px-4">Fill Rate</th>
                <th className="py-3 px-4">Attended</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4 text-right">Gateway Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--cf-border)]">
              {eventsPerformance.map((ev) => {
                const pct = Math.min(
                  100,
                  Math.round((Number(ev.registered_count) / Math.max(1, Number(ev.capacity))) * 100)
                );
                return (
                  <tr key={ev.id} className="hover:bg-[var(--cf-surface-muted)]/50">
                    <td className="py-3.5 px-4">
                      <Link
                        to={`${eventLinkPrefix}/${ev.slug}`}
                        className="font-bold text-sm text-[var(--cf-text)] hover:text-[var(--cf-primary)]"
                      >
                        {ev.title}
                      </Link>
                      <p className="text-[11px] font-mono-code text-[var(--cf-text-secondary)]">
                        {formatEventDateShort(ev.event_date)} · {ev.category}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 font-mono-code font-semibold text-[var(--cf-primary)]">
                      {ev.department_code}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 font-mono-code">
                        <div className="w-20 h-1.5 rounded-full bg-[var(--cf-bg)] border border-[var(--cf-border)] overflow-hidden">
                          <div className="h-full bg-[var(--cf-primary)]" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="font-semibold text-[var(--cf-text)]">{pct}%</span>
                        <span className="text-[var(--cf-text-secondary)]">
                          ({ev.registered_count}/{ev.capacity})
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono-code">
                      <span className="px-2 py-0.5 rounded bg-[#059669]/10 text-[#059669] font-semibold">
                        {ev.attended_count} checked in
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono-code text-amber-500 font-bold">
                      {ev.avg_rating ? (
                        <span className="inline-flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" /> {ev.avg_rating}
                        </span>
                      ) : (
                        <span className="text-[var(--cf-text-secondary)]">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-code font-bold text-[var(--cf-text)]">
                      {Number(ev.revenue || 0) > 0
                        ? `₹${Number(ev.revenue).toLocaleString('en-IN')}`
                        : Number(ev.registration_fee || 0) > 0
                        ? `₹0 (₹${ev.registration_fee}/pass)`
                        : 'FREE'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
