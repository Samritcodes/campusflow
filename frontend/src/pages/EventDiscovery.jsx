import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useLocation, Link } from 'react-router-dom';
import { Search, Bookmark, ArrowUpDown, X, Sparkles, Compass } from 'lucide-react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/events/EventCard';

const CATEGORIES = ['All', 'Hackathon', 'Workshop', 'Cultural', 'Seminar', 'Tech Talk'];
const DEPARTMENTS = ['All', 'CSE', 'AIML', 'ECE', 'ME', 'CULT'];

export default function EventDiscovery() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { user } = useAuth();
  const isStudentWorkspace = location.pathname.startsWith('/student');

  const [events, setEvents] = useState([]);
  const [followedCodes, setFollowedCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedMode, setFeedMode] = useState('all'); // 'all' | 'for_you'
  const [savedOnly, setSavedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('date_asc');

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [department, setDepartment] = useState(searchParams.get('department') || 'All');

  useEffect(() => {
    setQuery(searchParams.get('q') || '');
    setCategory(searchParams.get('category') || 'All');
    setDepartment(searchParams.get('department') || 'All');
    if (searchParams.get('feed') === 'for_you') {
      setFeedMode('for_you');
    }
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (category !== 'All') params.set('category', category);
    if (department !== 'All') params.set('department', department);

    apiRequest(`/events/index.php?${params.toString()}`)
      .then((res) => {
        setEvents(res.data?.events || []);
        setFollowedCodes(res.data?.followed_department_codes || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [query, category, department, user?.id]);

  const handleDepartmentChange = (dept) => {
    setDepartment(dept);
    const next = new URLSearchParams(searchParams);
    if (dept === 'All') next.delete('department');
    else next.set('department', dept);
    setSearchParams(next, { replace: true });
  };

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
      // ignore
    }
  };

  const clearAllFilters = () => {
    setQuery('');
    setCategory('All');
    setDepartment('All');
    setSavedOnly(false);
    setFeedMode('all');
    setSortBy('date_asc');
    setSearchParams({}, { replace: true });
  };

  const forYouCount = useMemo(
    () => events.filter((e) => Number(e.recommendation_score || 0) > 0).length,
    [events]
  );

  const displayedEvents = useMemo(() => {
    let base = savedOnly ? events.filter((e) => e.is_saved) : [...events];
    if (feedMode === 'for_you' && user) {
      base = base.filter((e) => Number(e.recommendation_score || 0) > 0);
    }

    return base.sort((a, b) => {
      if (feedMode === 'for_you' && sortBy === 'date_asc') {
        const scoreDiff = Number(b.recommendation_score || 0) - Number(a.recommendation_score || 0);
        if (scoreDiff !== 0) return scoreDiff;
      }
      if (sortBy === 'popular') {
        return Number(b.registered_count || 0) - Number(a.registered_count || 0);
      }
      if (sortBy === 'free_first') {
        return Number(a.registration_fee || 0) - Number(b.registration_fee || 0);
      }
      if (sortBy === 'featured') {
        return Number(b.is_featured || 0) - Number(a.is_featured || 0);
      }
      return String(a.event_date || '').localeCompare(String(b.event_date || ''));
    });
  }, [events, savedOnly, feedMode, sortBy, user]);

  const hasActiveFilters =
    query.trim() !== '' ||
    category !== 'All' ||
    department !== 'All' ||
    savedOnly ||
    feedMode === 'for_you';

  return (
    <div className={isStudentWorkspace ? 'space-y-8' : 'max-w-7xl mx-auto px-6 py-12 space-y-10'}>
      <header className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-mono-code font-semibold uppercase tracking-widest text-[var(--cf-primary)]">
              CAMPUS DIRECTORY & PERSONALIZED FEED
            </p>
            <h1 className="font-editorial text-4xl sm:text-5xl text-[var(--cf-text)] mt-1">
              {feedMode === 'for_you' ? 'Curated For You' : 'Discover campus events'}
            </h1>
          </div>

          {/* Feed Mode Switcher: For You vs All Events */}
          {user && (
            <div className="inline-flex items-center p-1 rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)]">
              <button
                type="button"
                onClick={() => setFeedMode('all')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  feedMode === 'all'
                    ? 'bg-[var(--cf-text)] text-[var(--cf-bg)]'
                    : 'text-[var(--cf-text-secondary)] hover:text-[var(--cf-text)]'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                All Events ({events.length})
              </button>
              <button
                type="button"
                onClick={() => setFeedMode('for_you')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  feedMode === 'for_you'
                    ? 'bg-[var(--cf-primary)] text-white'
                    : 'text-[var(--cf-text-secondary)] hover:text-[var(--cf-text)]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                For You ({forYouCount})
              </button>
            </div>
          )}
        </div>

        {/* Personalized Feed Explainer Bar when in "For You" mode */}
        {user && feedMode === 'for_you' && (
          <div className="p-4 rounded-xl border border-[var(--cf-primary)]/30 bg-[var(--cf-primary)]/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-mono-code font-bold uppercase text-[var(--cf-primary)] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> PERSONALIZED CAMPUS FEED
              </p>
              <p className="text-xs text-[var(--cf-text-secondary)]">
                Matched to your interests (
                <strong className="text-[var(--cf-text)]">
                  {user.interests || 'AI, Web, Hackathon'}
                </strong>
                ) and followed communities (
                <strong className="text-[var(--cf-text)]">
                  {followedCodes.length > 0
                    ? followedCodes.join(', ')
                    : user.department_code || 'Campus'}
                </strong>
                ).
              </p>
            </div>
            {user.role === 'STUDENT' && (
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to="/student/departments"
                  className="px-3 py-1.5 rounded-md border border-[var(--cf-border)] bg-[var(--cf-surface)] text-xs font-semibold text-[var(--cf-text)] hover:border-[var(--cf-primary)]"
                >
                  Follow Clubs
                </Link>
                <Link
                  to="/student/profile"
                  className="px-3 py-1.5 rounded-md border border-[var(--cf-border)] bg-[var(--cf-surface)] text-xs font-semibold text-[var(--cf-text)] hover:border-[var(--cf-primary)]"
                >
                  Edit Interests
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Elevated Filter & Search Control Bar */}
        <div className="p-5 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] space-y-4 shadow-2xs">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[var(--cf-text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by event title, topic, or venue..."
                className="w-full pl-10 pr-9 py-2.5 rounded-lg bg-[var(--cf-bg)] border border-[var(--cf-border)] text-sm text-[var(--cf-text)] placeholder-[var(--cf-text-secondary)] focus:outline-none focus:border-[var(--cf-primary)]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--cf-text-secondary)] hover:text-[var(--cf-text)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort Selector + Saved Filter */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--cf-border)] bg-[var(--cf-bg)] text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-[var(--cf-primary)]" />
                <span className="text-[var(--cf-text-secondary)] font-medium">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent font-semibold text-[var(--cf-text)] focus:outline-none cursor-pointer"
                >
                  <option value="date_asc">
                    {feedMode === 'for_you' ? 'Best Match & Date' : 'Upcoming Soonest'}
                  </option>
                  <option value="popular">Most Popular</option>
                  <option value="featured">Featured & Highlights</option>
                  <option value="free_first">Free Entry First</option>
                </select>
              </div>

              {user && (
                <button
                  type="button"
                  onClick={() => setSavedOnly((v) => !v)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                    savedOnly
                      ? 'border-[var(--cf-primary)] bg-[var(--cf-primary)] text-white'
                      : 'border-[var(--cf-border)] bg-[var(--cf-bg)] text-[var(--cf-text)] hover:border-[var(--cf-primary)]'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${savedOnly ? 'fill-current' : ''}`} />
                  Saved ({events.filter((e) => e.is_saved).length})
                </button>
              )}
            </div>
          </div>

          {/* Category + Department Filter Row */}
          <div className="pt-3 border-t border-[var(--cf-border)] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    category === cat
                      ? 'bg-[var(--cf-text)] text-[var(--cf-bg)]'
                      : 'bg-[var(--cf-bg)] text-[var(--cf-text-secondary)] hover:text-[var(--cf-text)]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="font-mono-code text-[11px] uppercase text-[var(--cf-text-secondary)] mr-1">
                Dept:
              </span>
              {DEPARTMENTS.map((dept) => (
                <button
                  key={dept}
                  onClick={() => handleDepartmentChange(dept)}
                  className={`px-2.5 py-1 rounded-md font-mono-code text-xs transition-colors cursor-pointer ${
                    department === dept
                      ? 'bg-[var(--cf-primary)] text-white font-semibold'
                      : 'text-[var(--cf-text-secondary)] hover:text-[var(--cf-text)]'
                  }`}
                >
                  {dept}
                </button>
              ))}

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="ml-2 text-xs font-semibold text-[var(--cf-primary)] hover:underline cursor-pointer"
                >
                  Reset all
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="py-16 text-center text-sm text-[var(--cf-text-secondary)]">
          Loading campus events...
        </div>
      ) : displayedEvents.length === 0 ? (
        <div className="p-14 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-center space-y-3">
          <p className="font-editorial text-3xl text-[var(--cf-text)]">
            {savedOnly
              ? 'No saved events yet'
              : feedMode === 'for_you'
              ? 'No personalized matches for current filters'
              : 'No matching events found'}
          </p>
          <p className="text-sm text-[var(--cf-text-secondary)] max-w-md mx-auto">
            {savedOnly
              ? 'Bookmark any event using the ribbon icon on the card or event page to save it here.'
              : feedMode === 'for_you'
              ? 'Try following more departments/clubs or switching back to All Events.'
              : 'Try clearing your search query or switching department and category filters.'}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--cf-primary)] text-white text-xs font-semibold cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {displayedEvents.map((event) => (
            <div key={event.id} className="flex flex-col">
              {feedMode === 'for_you' &&
                Array.isArray(event.match_reasons) &&
                event.match_reasons.length > 0 && (
                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    {event.match_reasons.slice(0, 3).map((reason) => (
                      <span
                        key={reason}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-[var(--cf-primary)]/10 text-[var(--cf-primary)] border border-[var(--cf-primary)]/20"
                      >
                        ✦ {reason}
                      </span>
                    ))}
                  </div>
                )}
              <EventCard
                event={event}
                linkPrefix={isStudentWorkspace ? '/student/events' : '/events'}
                onToggleSave={user ? handleToggleSave : undefined}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
