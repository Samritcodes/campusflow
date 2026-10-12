import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Calendar,
  MapPin,
  Ticket,
  Sparkles,
  ShieldCheck,
  Users,
  Trophy,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useAuth, getHomePathForRole } from '../context/AuthContext';
import EventCard from '../components/events/EventCard';
import { formatEventDateLong, formatTime12h } from '../utils/date';

const CATEGORIES = ['All', 'Hackathon', 'Workshop', 'Cultural', 'Seminar', 'Tech Talk'];

const DEPARTMENTS_LIST = [
  { code: 'CSE', name: 'Computer Science & Engineering', tag: 'Hackathons · Systems · Cloud' },
  { code: 'AIML', name: 'Artificial Intelligence & ML', tag: 'GenAI · Deep Learning · Research' },
  { code: 'ECE', name: 'Electronics & Communication', tag: 'Robotics · VLSI · Embedded' },
  { code: 'ME', name: 'Mechanical Engineering', tag: 'CAD · Autonomous Vehicles' },
  { code: 'CULT', name: 'Student Cultural Council', tag: 'Music · Drama · Campus Fest' },
];

export default function LandingPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/events/index.php')
      .then((res) => setEvents(res.data?.events || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleToggleSave = async (eventId) => {
    if (!user) return;
    try {
      const res = await apiRequest('/events/bookmark.php', {
        method: 'POST',
        body: { event_id: eventId },
      });
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === eventId ? { ...ev, is_saved: Boolean(res.data?.saved) } : ev
        )
      );
    } catch {
      // ignore if unauthenticated
    }
  };

  const filteredEvents =
    activeCategory === 'All'
      ? events
      : events.filter((e) => e.category.toLowerCase() === activeCategory.toLowerCase());

  const heroEvent = events.find((e) => Number(e.is_featured) === 1) || events[0];
  const heroSeatsLeft = heroEvent
    ? Math.max(0, heroEvent.capacity - heroEvent.registered_count)
    : 0;
  const heroFillPct = heroEvent
    ? Math.min(100, Math.round((heroEvent.registered_count / heroEvent.capacity) * 100))
    : 75;

  return (
    <div>
      {/* SECTION 1: Immersive Editorial Hero + Featured Event Spotlight */}
      <section className="max-w-7xl mx-auto px-6 pt-12 pb-20 lg:pt-16 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Left Column: Brand Headline & Primary Actions */}
          <div className="lg:col-span-6 space-y-7">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-[var(--cf-border)] bg-[var(--cf-surface)] text-xs font-medium text-[var(--cf-text-secondary)]">
              <span className="w-2 h-2 rounded-full bg-[var(--cf-primary)]" />
              <span>CampusFlow · Autumn Semester 2026</span>
            </div>

            <h1 className="font-editorial text-5xl sm:text-6xl lg:text-[68px] leading-[1.02] tracking-tight text-[var(--cf-text)]">
              Everything happening around your campus.
            </h1>

            <p className="text-base sm:text-lg text-[var(--cf-text-secondary)] max-w-xl leading-relaxed">
              The unified campus platform for students and college clubs. Discover hackathons,
              department symposiums, and cultural nights—register in seconds, form your squad, and
              carry your verified digital pass and certificates in one place.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                to="/events"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-lg bg-[var(--cf-primary)] hover:bg-[var(--cf-primary-hover)] text-white font-semibold text-sm transition-colors shadow-xs"
              >
                <span>Discover events</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {user ? (
                <Link
                  to={getHomePathForRole(user.role)}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] hover:bg-[var(--cf-surface-muted)] text-[var(--cf-text)] font-semibold text-sm transition-colors"
                >
                  Open my workspace <ArrowUpRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] hover:bg-[var(--cf-surface-muted)] text-[var(--cf-text)] font-semibold text-sm transition-colors"
                >
                  Student & Organizer Sign In
                </Link>
              )}
            </div>

            {/* Key Platform Pillars */}
            <div className="pt-6 border-t border-[var(--cf-border)] grid grid-cols-3 gap-6 max-w-lg">
              <div>
                <p className="font-editorial text-3xl sm:text-4xl text-[var(--cf-text)]">248+</p>
                <p className="text-xs text-[var(--cf-text-secondary)] mt-0.5">
                  Verified campus events
                </p>
              </div>
              <div>
                <p className="font-editorial text-3xl sm:text-4xl text-[var(--cf-text)]">12</p>
                <p className="text-xs text-[var(--cf-text-secondary)] mt-0.5">
                  Academic departments
                </p>
              </div>
              <div>
                <p className="font-editorial text-3xl sm:text-4xl text-[var(--cf-text)]">4.8k</p>
                <p className="text-xs text-[var(--cf-text-secondary)] mt-0.5">
                  Student passes issued
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Large Immersive Featured Event Spotlight */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] overflow-hidden shadow-lg">
              <div className="relative aspect-[16/10] overflow-hidden bg-[var(--cf-surface-muted)]">
                <img
                  src={
                    heroEvent?.banner_url ||
                    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1400&q=85'
                  }
                  alt={heroEvent?.title || 'Featured Campus Event'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--cf-primary)] text-white">
                    Featured Spotlight
                  </span>
                  {heroEvent && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/95 text-[#161514]">
                      {heroEvent.category} · {heroEvent.department_code}
                    </span>
                  )}
                </div>

                {heroEvent && (
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <p className="text-xs font-mono-code uppercase tracking-wider text-white/85 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatEventDateLong(heroEvent.event_date)} · {formatTime12h(heroEvent.start_time)}
                    </p>
                    <h2 className="font-editorial text-3xl sm:text-4xl leading-tight mt-1">
                      {heroEvent.title}
                    </h2>
                  </div>
                )}
              </div>

              {heroEvent && (
                <div className="p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                    <span className="inline-flex items-center gap-1.5 font-medium text-[var(--cf-text)]">
                      <MapPin className="w-4 h-4 text-[var(--cf-primary)]" />
                      {heroEvent.venue}
                    </span>
                    {heroEvent.prize_pool ? (
                      <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--cf-success)]">
                        <Trophy className="w-4 h-4" /> {heroEvent.prize_pool}
                      </span>
                    ) : (
                      <span className="font-mono-code text-[var(--cf-text-secondary)]">
                        Organized by {heroEvent.department_name}
                      </span>
                    )}
                  </div>

                  {/* Registration Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--cf-text-secondary)]">
                        Registration status:{' '}
                        <strong className="text-[var(--cf-text)]">
                          {heroSeatsLeft > 0 ? `${heroSeatsLeft} seats remaining` : 'Waitlist open'}
                        </strong>
                      </span>
                      <span className="font-mono-code font-semibold text-[var(--cf-text)]">
                        {heroEvent.registered_count} / {heroEvent.capacity} joined
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[var(--cf-surface-muted)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--cf-primary)] rounded-full transition-all"
                        style={{ width: `${heroFillPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-[11px] font-mono-code uppercase text-[var(--cf-text-secondary)] block">
                        ENTRY PASS
                      </span>
                      <span className="text-base font-bold text-[var(--cf-text)]">
                        {Number(heroEvent.registration_fee || 0) > 0
                          ? `₹${heroEvent.registration_fee} · Verified Pass`
                          : 'Free Entry · Instant Pass'}
                      </span>
                    </div>

                    <Link
                      to={`/events/${heroEvent.slug}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--cf-text)] text-[var(--cf-bg)] hover:opacity-90 text-xs font-semibold transition-opacity"
                    >
                      <span>View featured event</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Distinct Surface Band — Curated Discovery Experience */}
      <section className="bg-[var(--cf-surface)] border-y border-[var(--cf-border)] py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <p className="text-xs font-mono-code font-semibold uppercase tracking-widest text-[var(--cf-primary)]">
                UPCOMING SCHEDULE
              </p>
              <h2 className="font-editorial text-4xl sm:text-5xl text-[var(--cf-text)] mt-1">
                Happening across campus
              </h2>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-[var(--cf-primary)] text-white shadow-2xs'
                      : 'border border-[var(--cf-border)] bg-[var(--cf-bg)] text-[var(--cf-text-secondary)] hover:text-[var(--cf-text)]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-sm text-[var(--cf-text-secondary)]">
              Loading campus schedule...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  linkPrefix={user?.role === 'STUDENT' ? '/student/events' : '/events'}
                  onToggleSave={user?.role === 'STUDENT' ? handleToggleSave : undefined}
                />
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <Link
              to="/events"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-[var(--cf-border)] bg-[var(--cf-bg)] hover:border-[var(--cf-primary)] text-sm font-semibold text-[var(--cf-text)] transition-colors"
            >
              <span>Browse full directory, search & filter</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 3: Built for Both Students & Event Organizers (Product Identity) */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-mono-code font-semibold uppercase tracking-widest text-[var(--cf-primary)]">
            A COMPLETE CAMPUS ECOSYSTEM
          </p>
          <h2 className="font-editorial text-4xl sm:text-5xl text-[var(--cf-text)] mt-1">
            Built for students discovering events and clubs running them.
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* For Students Card */}
          <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--cf-primary)]/10 text-[var(--cf-primary)]">
                <Ticket className="w-3.5 h-3.5" /> For Students
              </span>
              <h3 className="font-editorial text-3xl sm:text-4xl text-[var(--cf-text)]">
                One pass wallet for every hackathon, workshop, and fest.
              </h3>
              <p className="text-sm text-[var(--cf-text-secondary)] leading-relaxed">
                No more scattered Google Forms or lost spreadsheets. Get personalized event
                recommendations matched to your department and interests, register solo or as a
                squad, and unlock official Merit & Participation Certificates the moment your
                attendance is verified.
              </p>
              <ul className="space-y-2.5 pt-2 text-sm text-[var(--cf-text)]">
                <li className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-[var(--cf-primary)] shrink-0" />
                  <span>Personalized recommendations & saved event bookmarks</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-[var(--cf-primary)] shrink-0" />
                  <span>Squad registration with shareable team codes (`TEAM-XXXX`)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[var(--cf-success)] shrink-0" />
                  <span>Instant digital pass, `.ics` calendar export & printable certificates</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-[var(--cf-border)]">
              <Link
                to={user?.role === 'STUDENT' ? '/student' : '/register'}
                className="inline-flex items-center gap-2 text-sm font-bold text-[var(--cf-primary)] hover:underline"
              >
                <span>{user?.role === 'STUDENT' ? 'Go to Student Dashboard' : 'Create your student account'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* For Organizers & Clubs Card */}
          <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--cf-success)]/10 text-[var(--cf-success)]">
                <Trophy className="w-3.5 h-3.5" /> For Clubs, Organizers & Departments
              </span>
              <h3 className="font-editorial text-3xl sm:text-4xl text-[var(--cf-text)]">
                Publish schedules, verify passes at the door, and crown winners.
              </h3>
              <p className="text-sm text-[var(--cf-text-secondary)] leading-relaxed">
                Manage your entire event lifecycle from one workspace. Publish itineraries and
                eligibility rules, collect entry fees with verified receipts, check in attendees at
                the venue desk, and publish the official Winners Podium with one click.
              </p>
              <ul className="space-y-2.5 pt-2 text-sm text-[var(--cf-text)]">
                <li className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[var(--cf-success)] shrink-0" />
                  <span>Live Entry Desk pass verification & automatic waitlist promotion</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Trophy className="w-4 h-4 text-[var(--cf-success)] shrink-0" />
                  <span>Winners Podium selector that auto-upgrades student Merit Certificates</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-[var(--cf-success)] shrink-0" />
                  <span>Department analytics, urgent bulletins & one-click `.CSV` roster export</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-[var(--cf-border)]">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-bold text-[var(--cf-text)] hover:text-[var(--cf-primary)] transition-colors"
              >
                <span>Access Organizer & Department Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Explore by Department */}
      <section id="departments" className="max-w-7xl mx-auto px-6 pb-20">
        <div className="border-t border-[var(--cf-border)] pt-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-mono-code font-semibold uppercase tracking-widest text-[var(--cf-primary)]">
                ACADEMIC & CULTURAL UNITS
              </p>
              <h2 className="font-editorial text-4xl sm:text-5xl text-[var(--cf-text)] mt-1">
                Explore by department
              </h2>
            </div>
            <Link
              to="/events"
              className="text-xs font-semibold text-[var(--cf-text-secondary)] hover:text-[var(--cf-text)] inline-flex items-center gap-1"
            >
              View all departments <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {DEPARTMENTS_LIST.map((dept) => (
              <Link
                key={dept.code}
                to={`/events?department=${dept.code}`}
                className="group p-6 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] hover:border-[var(--cf-primary)] transition-all flex flex-col justify-between"
              >
                <div>
                  <span className="inline-block px-2.5 py-1 rounded-md font-mono-code text-xs font-bold bg-[var(--cf-primary)]/10 text-[var(--cf-primary)]">
                    {dept.code}
                  </span>
                  <h3 className="text-base font-bold text-[var(--cf-text)] mt-3 leading-snug group-hover:text-[var(--cf-primary)] transition-colors">
                    {dept.name}
                  </h3>
                  <p className="text-xs text-[var(--cf-text-secondary)] mt-1.5">
                    {dept.tag}
                  </p>
                </div>
                <span className="mt-6 pt-3 border-t border-[var(--cf-border)] text-xs font-semibold text-[var(--cf-text-secondary)] group-hover:text-[var(--cf-text)] inline-flex items-center justify-between">
                  <span>Explore events</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

