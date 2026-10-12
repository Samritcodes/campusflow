import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Plus, Users, Sparkles } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import EventCard from '../../components/events/EventCard';

export default function StudentDepartmentsPage() {
  const { user, announcements } = useAuth();
  const [allDepartments, setAllDepartments] = useState([]);
  const [myDepartment, setMyDepartment] = useState(null);
  const [deptEvents, setDeptEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiRequest('/departments/overview.php'),
      user?.department_code
        ? apiRequest(`/events/index.php?department=${encodeURIComponent(user.department_code)}`)
        : Promise.resolve({ data: { events: [] } }),
    ])
      .then(([deptRes, evRes]) => {
        const allDepts = deptRes.data?.departments || [];
        setAllDepartments(allDepts);
        const matched = allDepts.find(
          (d) => d.id === Number(user?.department_id) || d.code === user?.department_code
        );
        setMyDepartment(matched || allDepts[0] || null);
        setDeptEvents(evRes.data?.events || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.department_id, user?.department_code]);

  const handleToggleFollow = async (deptId) => {
    setTogglingId(deptId);
    try {
      const res = await apiRequest('/departments/follow.php', {
        method: 'POST',
        body: { department_id: deptId },
      });
      setAllDepartments((prev) =>
        prev.map((d) =>
          d.id === deptId
            ? {
                ...d,
                is_followed: Boolean(res.data?.is_followed),
                follower_count: Number(res.data?.follower_count ?? d.follower_count),
              }
            : d
        )
      );
    } catch {
      // ignore
    } finally {
      setTogglingId(null);
    }
  };

  const deptAnnouncements = (announcements || []).filter(
    (a) => a.department_code === user?.department_code
  );

  if (loading) {
    return <p className="text-sm text-[var(--cf-text-secondary)]">Loading campus communities...</p>;
  }

  return (
    <div className="space-y-12">
      {/* Student's Own Home Department Header */}
      {myDepartment && (
        <header className="border-b border-[var(--cf-border)] pb-8">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-mono-code font-bold bg-[var(--cf-primary)] text-white">
              YOUR HOME DEPARTMENT · {myDepartment.code}
            </span>
            {user?.year_of_study && user.year_of_study !== 'N/A' && (
              <span className="text-xs font-mono-code text-[var(--cf-text-secondary)]">
                · {user.year_of_study}
              </span>
            )}
          </div>

          <h1 className="font-editorial text-4xl sm:text-5xl text-[var(--cf-text)] mt-1">
            {myDepartment.name}
          </h1>
          <p className="text-sm text-[var(--cf-text-secondary)] mt-2 max-w-2xl leading-relaxed">
            {myDepartment.description}
          </p>

          <div className="mt-6 pt-6 border-t border-[var(--cf-border)] grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <p className="text-[11px] font-mono-code uppercase text-[var(--cf-text-secondary)]">
                DEPARTMENT LEAD
              </p>
              <p className="text-sm font-bold text-[var(--cf-text)] mt-1">
                {myDepartment.lead_name || 'Faculty Coordinator'}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-mono-code uppercase text-[var(--cf-text-secondary)]">
                ACTIVE {myDepartment.code} EVENTS
              </p>
              <p className="font-editorial text-3xl text-[var(--cf-text)] mt-0.5">
                {myDepartment.event_count}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-mono-code uppercase text-[var(--cf-text-secondary)]">
                ENROLLED STUDENTS
              </p>
              <p className="font-editorial text-3xl text-[var(--cf-text)] mt-0.5">
                {myDepartment.student_count}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-mono-code uppercase text-[var(--cf-text-secondary)]">
                COMMUNITY FOLLOWERS
              </p>
              <p className="font-editorial text-3xl text-[var(--cf-text)] mt-0.5">
                {myDepartment.follower_count || 0}
              </p>
            </div>
          </div>
        </header>
      )}

      {/* Discover Clubs & Campus Communities (Follow for Personalized Feed) */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p className="text-xs font-mono-code uppercase tracking-widest text-[var(--cf-primary)] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> CAMPUS COMMUNITIES & CLUBS
            </p>
            <h2 className="font-editorial text-3xl text-[var(--cf-text)] mt-0.5">
              Follow departments & student societies
            </h2>
            <p className="text-xs text-[var(--cf-text-secondary)] mt-1">
              Following a department or society automatically adds its upcoming hackathons, workshops, and fests to your &ldquo;For You&rdquo; feed.
            </p>
          </div>
          <Link
            to="/student/discover?feed=for_you"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[var(--cf-primary)] text-white text-xs font-semibold hover:bg-[var(--cf-primary-hover)] shrink-0"
          >
            Open My For You Feed <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {allDepartments.map((dept) => {
            const isHome = Number(dept.id) === Number(user?.department_id);
            const isFollowed = Boolean(dept.is_followed) || isHome;
            return (
              <div
                key={dept.id}
                className="p-5 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded text-xs font-mono-code font-bold bg-[var(--cf-bg)] border border-[var(--cf-border)] text-[var(--cf-primary)]">
                      {dept.code}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono-code text-[var(--cf-text-secondary)]">
                      <Users className="w-3 h-3" /> {dept.follower_count || 0} following
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[var(--cf-text)]">{dept.name}</h3>
                  <p className="text-xs text-[var(--cf-text-secondary)] mt-1.5 line-clamp-2 leading-relaxed">
                    {dept.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[var(--cf-border)] flex items-center justify-between gap-2">
                  <Link
                    to={`/student/discover?department=${encodeURIComponent(dept.code)}`}
                    className="text-xs font-mono-code text-[var(--cf-text-secondary)] hover:text-[var(--cf-text)]"
                  >
                    {dept.event_count} active {dept.event_count === 1 ? 'event' : 'events'} →
                  </Link>

                  <button
                    type="button"
                    disabled={togglingId === dept.id}
                    onClick={() => handleToggleFollow(dept.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                      isFollowed
                        ? 'border-[#059669]/40 bg-[#059669]/10 text-[#059669]'
                        : 'border-[var(--cf-border)] bg-[var(--cf-bg)] text-[var(--cf-text)] hover:border-[var(--cf-primary)]'
                    }`}
                  >
                    {isFollowed ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Following
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" /> Follow
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Events Hosted by THIS Student's Home Department */}
      {myDepartment && (
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs font-mono-code uppercase tracking-widest text-[var(--cf-primary)]">
                {myDepartment.code} SCHEDULE
              </p>
              <h2 className="font-editorial text-3xl text-[var(--cf-text)] mt-0.5">
                Events in your home department
              </h2>
            </div>
            <Link
              to="/student/discover"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--cf-text-secondary)] hover:text-[var(--cf-text)]"
            >
              All campus events <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {deptEvents.length === 0 ? (
            <div className="p-8 rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] text-sm text-[var(--cf-text-secondary)]">
              No upcoming events are currently scheduled by {myDepartment.name}.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {deptEvents.map((ev) => (
                <EventCard key={ev.id} event={ev} linkPrefix="/student/events" />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Department Bulletins */}
      {deptAnnouncements.length > 0 && myDepartment && (
        <section>
          <h2 className="text-xs font-mono-code font-semibold uppercase tracking-widest text-[var(--cf-text-secondary)] mb-4">
            {myDepartment.code} DEPARTMENT BULLETINS
          </h2>
          <div className="rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] divide-y divide-[var(--cf-border)]">
            {deptAnnouncements.map((ann) => (
              <div key={ann.id} className="p-5">
                <div className="flex items-center justify-between text-xs font-mono-code text-[var(--cf-primary)] mb-1">
                  <span>{ann.priority}</span>
                  <span className="text-[var(--cf-text-secondary)]">{ann.author_name}</span>
                </div>
                <h3 className="text-sm font-bold text-[var(--cf-text)]">{ann.title}</h3>
                <p className="text-xs text-[var(--cf-text-secondary)] mt-1 leading-relaxed">
                  {ann.message}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
