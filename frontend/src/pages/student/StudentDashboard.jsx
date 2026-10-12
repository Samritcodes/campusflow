import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Sparkles } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import EventCard from '../../components/events/EventCard';
import { formatEventDateShort, formatTime12h, getGreeting } from '../../utils/date';

export default function StudentDashboard() {
  const { user, myPasses, announcements } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/events/index.php')
      .then((res) => setEvents(res.data?.events || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/student/discover?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/student/discover');
    }
  };

  const firstName = user?.full_name?.split(' ')[0] || 'Student';
  const featuredEvent = events.find((e) => e.is_featured) || events[0];
  const thisWeekEvents = events.slice(0, 3);

  // Interest-Based Recommendations (Stage B)
  const interestTags = (user?.interests || 'AI,Web,Hackathon,Cultural')
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const recommendedEvents = events
    .filter((ev) => {
      const hay = `${ev.title} ${ev.category} ${ev.description} ${ev.department_code}`.toLowerCase();
      return (
        ev.department_code === user?.department_code ||
        interestTags.some((tag) => hay.includes(tag))
      );
    })
    .slice(0, 3);

  return (
    <div className="space-y-12">
      {/* Header + Search */}
      <header className="border-b border-[var(--cf-border)] pb-8">
        <p className="text-xs font-mono-code uppercase tracking-widest text-[var(--cf-text-secondary)]">
          {getGreeting()}, {firstName} · {user?.department_code} {user?.year_of_study}
        </p>
        <h1 className="font-editorial text-4xl sm:text-5xl text-[var(--cf-text)] mt-1">
          What’s happening on campus?
        </h1>

        <form onSubmit={handleSearchSubmit} className="mt-6 max-w-xl relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events, departments, or venues..."
            className="w-full pl-4 pr-11 py-3 rounded-md bg-[var(--cf-surface)] border border-[var(--cf-border)] text-sm text-[var(--cf-text)] placeholder-[var(--cf-text-secondary)] focus:outline-none focus:border-[var(--cf-primary)]"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--cf-text-secondary)] hover:text-[var(--cf-text)] cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>
        </form>
      </header>

      {/* FEATURED EVENT */}
      {featuredEvent && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono-code font-semibold uppercase tracking-widest text-[var(--cf-primary)]">
              FEATURED
            </span>
            <Link
              to="/student/discover"
              className="text-xs font-semibold text-[var(--cf-text-secondary)] hover:text-[var(--cf-text)]"
            >
              Full calendar →
            </Link>
          </div>

          <div className="rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-7 aspect-[16/10] lg:aspect-auto bg-[var(--cf-surface-muted)] overflow-hidden">
              <img
                src={featuredEvent.banner_url}
                alt={featuredEvent.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="lg:col-span-5 p-7 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-[var(--cf-border)]">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono-code text-[var(--cf-primary)] mb-3">
                  <span>{featuredEvent.category.toUpperCase()}</span>
                  <span>·</span>
                  <span>{featuredEvent.department_code} DEPT</span>
                </div>

                <h2 className="font-editorial text-3xl sm:text-4xl leading-tight text-[var(--cf-text)]">
                  {featuredEvent.title}
                </h2>

                <p className="text-sm text-[var(--cf-text-secondary)] mt-3 leading-relaxed">
                  {featuredEvent.description}
                </p>
              </div>

              <div className="mt-8 pt-5 border-t border-[var(--cf-border)]">
                <p className="text-xs font-mono-code uppercase text-[var(--cf-text)] font-semibold">
                  {formatEventDateShort(featuredEvent.event_date)} · {formatTime12h(featuredEvent.start_time)} · {featuredEvent.venue}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <Link
                    to={`/student/events/${featuredEvent.slug}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[var(--cf-primary)] hover:bg-[var(--cf-primary-hover)] text-white text-xs font-semibold transition-colors"
                  >
                    View event <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <span className="text-xs text-[var(--cf-text-secondary)]">
                    {featuredEvent.registered_count} registered
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* RECOMMENDED FOR YOU — Interest & Department Match (Stage B) */}
      {!loading && recommendedEvents.length > 0 && (
        <section>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-5">
            <div>
              <p className="inline-flex items-center gap-1.5 text-xs font-mono-code font-semibold uppercase tracking-widest text-[var(--cf-primary)]">
                <Sparkles className="w-3.5 h-3.5" /> PERSONALIZED FOR {user?.department_code || 'YOU'}
              </p>
              <h2 className="font-editorial text-3xl text-[var(--cf-text)] mt-0.5">
                Recommended for your interests ({user?.interests || 'AI, Web, Hackathon'})
              </h2>
            </div>
            <Link to="/student/profile" className="text-xs font-semibold text-[var(--cf-text-secondary)] hover:text-[var(--cf-primary)]">
              Edit interests →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendedEvents.map((ev) => (
              <EventCard key={ev.id} event={ev} linkPrefix="/student/events" />
            ))}
          </div>
        </section>
      )}

      {/* UPCOMING THIS WEEK — Typographic Schedule Strip */}
      {thisWeekEvents.length > 0 && (
        <section>
          <h2 className="text-xs font-mono-code font-semibold uppercase tracking-widest text-[var(--cf-text-secondary)] mb-4">
            UPCOMING THIS WEEK
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 border-t border-b border-[var(--cf-border)] py-6">
            {thisWeekEvents.map((ev) => (
              <Link
                key={ev.id}
                to={`/student/events/${ev.slug}`}
                className="group block pr-4 border-l-2 border-transparent hover:border-[var(--cf-primary)] pl-3 transition-colors"
              >
                <p className="text-xs font-mono-code text-[var(--cf-primary)] font-semibold">
                  {formatEventDateShort(ev.event_date)} · {formatTime12h(ev.start_time)}
                </p>
                <h3 className="text-base font-bold text-[var(--cf-text)] mt-1 group-hover:text-[var(--cf-primary)] transition-colors">
                  {ev.title}
                </h3>
                <p className="text-xs text-[var(--cf-text-secondary)] mt-1">
                  {ev.category} · {ev.venue}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* TWO-COLUMN INFORMATION: Your Passes + Campus Bulletins */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-mono-code font-semibold uppercase tracking-widest text-[var(--cf-text-secondary)]">
              YOUR ACTIVE PASSES ({myPasses.length})
            </h2>
            <Link to="/student/passes" className="text-xs font-semibold text-[var(--cf-primary)] hover:underline">
              Open pass wallet →
            </Link>
          </div>

          <div className="rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] divide-y divide-[var(--cf-border)]">
            {myPasses.length === 0 ? (
              <div className="p-6 text-sm text-[var(--cf-text-secondary)]">
                You haven’t registered for any upcoming events yet.
              </div>
            ) : (
              myPasses.map((pass) => (
                <div key={pass.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono-code text-xs font-semibold text-[var(--cf-primary)]">
                        {pass.pass_id}
                      </span>
                      <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-[#059669]/10 text-[#059669] font-semibold">
                        {pass.status} ✓
                      </span>
                    </div>
                    <Link
                      to={`/student/events/${pass.event_slug}`}
                      className="text-sm font-bold text-[var(--cf-text)] hover:text-[var(--cf-primary)] block mt-1 truncate"
                    >
                      {pass.event_title}
                    </Link>
                    <p className="text-xs text-[var(--cf-text-secondary)] mt-0.5">
                      {formatEventDateShort(pass.event_date)} · {formatTime12h(pass.start_time)} · {pass.venue}
                    </p>
                  </div>
                  <Link
                    to={`/student/events/${pass.event_slug}`}
                    className="text-xs font-semibold text-[var(--cf-text-secondary)] hover:text-[var(--cf-text)] shrink-0"
                  >
                    Pass details →
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-mono-code font-semibold uppercase tracking-widest text-[var(--cf-text-secondary)]">
              CAMPUS BULLETINS
            </h2>
          </div>

          <div className="rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] divide-y divide-[var(--cf-border)]">
            {announcements.map((ann) => (
              <div key={ann.id} className="p-4">
                <div className="flex items-center justify-between text-[11px] font-mono-code text-[var(--cf-text-secondary)] mb-1">
                  <span className={ann.priority === 'URGENT' ? 'text-rose-600 font-semibold' : 'text-[var(--cf-primary)]'}>
                    {ann.priority}
                  </span>
                  <span>{ann.department_code || 'CAMPUS-WIDE'}</span>
                </div>
                <h3 className="text-sm font-bold text-[var(--cf-text)]">{ann.title}</h3>
                <p className="text-xs text-[var(--cf-text-secondary)] mt-1 leading-relaxed">
                  {ann.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
