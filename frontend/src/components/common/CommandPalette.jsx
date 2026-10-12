import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Calendar,
  Compass,
  Ticket,
  Sparkles,
  Megaphone,
  ArrowRight,
  Users,
} from 'lucide-react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export function triggerCommandPalette() {
  window.dispatchEvent(new CustomEvent('campusflow:open-command-palette'));
}

export default function CommandPalette() {
  const { user, announcements = [] } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    const onCustomOpen = () => setOpen(true);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('campusflow:open-command-palette', onCustomOpen);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('campusflow:open-command-palette', onCustomOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 40);
      apiRequest('/events/index.php')
        .then((res) => setEvents(res.data?.events || []))
        .catch(() => {});
    } else {
      setQuery('');
    }
  }, [open]);

  const rolePrefix =
    user?.role === 'ADMIN'
      ? '/admin'
      : user?.role === 'ORGANIZER' || user?.role === 'DEPARTMENT_MANAGER'
      ? '/organizer'
      : user?.role === 'STUDENT'
      ? '/student'
      : '';

  const quickLinks = useMemo(() => {
    if (!user) {
      return [
        { label: 'Explore All Campus Events', to: '/events', icon: Compass },
        { label: 'Student Login', to: '/login', icon: Users },
        { label: 'Create Campus Profile', to: '/register', icon: Sparkles },
      ];
    }
    if (user.role === 'STUDENT') {
      return [
        { label: 'Personalized "For You" Campus Feed', to: '/student/discover?feed=for_you', icon: Sparkles },
        { label: 'All Campus Events Directory', to: '/student/discover', icon: Compass },
        { label: 'Campus Calendar & Personal Reminders', to: '/student/calendar', icon: Calendar },
        { label: 'My Digital Passes & CCA Transcript', to: '/student/passes', icon: Ticket },
        { label: 'Follow Departments & Student Communities', to: '/student/departments', icon: Users },
        { label: 'Campus Announcements & Bulletins', to: '/student/announcements', icon: Megaphone },
      ];
    }
    return [
      { label: 'Workspace Dashboard & Roster', to: rolePrefix, icon: Compass },
      { label: 'Campus Calendar & Personal Reminders', to: `${rolePrefix}/calendar`, icon: Calendar },
      { label: 'Analytics & Insights', to: `${rolePrefix}/analytics`, icon: Sparkles },
      { label: 'Announcements & Bulletins', to: `${rolePrefix}/announcements`, icon: Megaphone },
    ];
  }, [user, rolePrefix]);

  const q = query.trim().toLowerCase();

  const matchedLinks = useMemo(() => {
    if (!q) return quickLinks;
    return quickLinks.filter((l) => l.label.toLowerCase().includes(q));
  }, [quickLinks, q]);

  const matchedEvents = useMemo(() => {
    if (!q) return events.slice(0, 5);
    return events
      .filter((ev) =>
        `${ev.title} ${ev.category} ${ev.department_code} ${ev.department_name} ${ev.venue}`
          .toLowerCase()
          .includes(q)
      )
      .slice(0, 6);
  }, [events, q]);

  const matchedAnnouncements = useMemo(() => {
    if (!q) return [];
    return announcements
      .filter((a) => `${a.title} ${a.message} ${a.department_code || ''}`.toLowerCase().includes(q))
      .slice(0, 3);
  }, [announcements, q]);

  const handleSelect = (to) => {
    setOpen(false);
    navigate(to);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-xs p-4 pt-20"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-2xl rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text)] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Header */}
        <div className="px-4 py-3.5 border-b border-[var(--cf-border)] bg-[var(--cf-bg)] flex items-center gap-3">
          <Search className="w-4 h-4 text-[var(--cf-primary)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search campus events, departments, reminders, or pages..."
            className="flex-1 bg-transparent text-sm text-[var(--cf-text)] placeholder-[var(--cf-text-secondary)] focus:outline-none"
          />
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded border border-[var(--cf-border)] text-[10px] font-mono-code text-[var(--cf-text-secondary)]">
            ESC
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-1 text-[var(--cf-text-secondary)] hover:text-[var(--cf-text)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[65vh] overflow-y-auto p-3 space-y-5">
          {/* Quick Navigation */}
          {matchedLinks.length > 0 && (
            <div>
              <p className="px-2.5 text-[10px] font-mono-code font-bold uppercase tracking-wider text-[var(--cf-text-secondary)] mb-1.5">
                QUICK NAVIGATION
              </p>
              <div className="space-y-1">
                {matchedLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.to}
                      type="button"
                      onClick={() => handleSelect(item.to)}
                      className="w-full px-3 py-2 rounded-lg flex items-center justify-between text-left text-xs font-semibold text-[var(--cf-text)] hover:bg-[var(--cf-bg)] transition-colors cursor-pointer"
                    >
                      <span className="inline-flex items-center gap-2.5">
                        <Icon className="w-3.5 h-3.5 text-[var(--cf-primary)]" />
                        {item.label}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[var(--cf-text-secondary)]" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Campus Events */}
          <div>
            <p className="px-2.5 text-[10px] font-mono-code font-bold uppercase tracking-wider text-[var(--cf-text-secondary)] mb-1.5">
              CAMPUS EVENTS ({matchedEvents.length})
            </p>
            {matchedEvents.length === 0 ? (
              <p className="px-3 py-2 text-xs text-[var(--cf-text-secondary)]">
                No matching events found.
              </p>
            ) : (
              <div className="space-y-1">
                {matchedEvents.map((ev) => {
                  const eventLink = rolePrefix
                    ? `${rolePrefix}/events/${ev.slug}`
                    : `/events/${ev.slug}`;
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => handleSelect(eventLink)}
                      className="w-full px-3 py-2.5 rounded-lg flex items-center justify-between text-left hover:bg-[var(--cf-bg)] transition-colors cursor-pointer"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[var(--cf-text)] truncate">
                          {ev.title}
                        </p>
                        <p className="text-[11px] font-mono-code text-[var(--cf-text-secondary)]">
                          {ev.department_code} · {ev.category} · {ev.venue}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono-code px-2 py-0.5 rounded border border-[var(--cf-border)] text-[var(--cf-primary)] shrink-0 ml-2">
                        {Number(ev.registration_fee || 0) > 0
                          ? `₹${Number(ev.registration_fee)}`
                          : 'FREE'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Matching Bulletins */}
          {matchedAnnouncements.length > 0 && (
            <div>
              <p className="px-2.5 text-[10px] font-mono-code font-bold uppercase tracking-wider text-[var(--cf-text-secondary)] mb-1.5">
                BULLETINS & ANNOUNCEMENTS
              </p>
              <div className="space-y-1">
                {matchedAnnouncements.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() =>
                      handleSelect(rolePrefix ? `${rolePrefix}/announcements` : '/events')
                    }
                    className="w-full px-3 py-2 rounded-lg text-left hover:bg-[var(--cf-bg)] transition-colors cursor-pointer"
                  >
                    <p className="text-xs font-bold text-[var(--cf-text)] truncate">{a.title}</p>
                    <p className="text-[11px] text-[var(--cf-text-secondary)] truncate">
                      {a.message}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
