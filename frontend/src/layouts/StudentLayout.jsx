import { useState } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { Sun, Moon, LogOut, Menu, X, Bell, Ticket, Megaphone, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { triggerCommandPalette } from '../components/common/CommandPalette';

const NAV_SECTIONS = [
  {
    label: 'HOME',
    items: [
      { name: 'Overview', to: '/student', end: true },
      { name: 'Discover', to: '/student/discover' },
    ],
  },
  {
    label: 'YOUR CAMPUS',
    items: [
      { name: 'Calendar & Reminders', to: '/student/calendar' },
      { name: 'My Events & Passes', to: '/student/passes' },
      { name: 'Profile', to: '/student/profile' },
    ],
  },
  {
    label: 'COMMUNITY',
    items: [
      { name: 'Announcements', to: '/student/announcements' },
      { name: 'Departments', to: '/student/departments' },
    ],
  },
];

export default function StudentLayout() {
  const { user, myPasses = [], announcements = [], logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Build live notifications from student passes & urgent/important bulletins
  const notifications = [
    ...myPasses.slice(0, 3).map((p) => ({
      id: `pass-${p.id}`,
      type: 'pass',
      title:
        p.status === 'ATTENDED'
          ? `Certificate Unlocked: ${p.event_title}`
          : `Pass ${p.status}: ${p.event_title}`,
      meta: `${p.pass_id}${Number(p.amount_paid || 0) > 0 ? ` · Paid ₹${Number(p.amount_paid)}` : ''}`,
      to: '/student/passes',
    })),
    ...announcements.slice(0, 3).map((a) => ({
      id: `ann-${a.id}`,
      type: 'bulletin',
      title: a.title,
      meta: `${a.priority} · ${a.department_code || 'CAMPUS-WIDE'}`,
      to: '/student/announcements',
    })),
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--cf-bg)] text-[var(--cf-text)]">
      {/* Mobile Header Bar (< 768px) */}
      <div className="md:hidden px-5 py-3.5 border-b border-[var(--cf-border)] bg-[var(--cf-surface)] flex items-center justify-between sticky top-0 z-40">
        <Link to="/" className="font-bold text-base tracking-tight uppercase">
          CampusFlow
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setNotifOpen((v) => !v)}
            className="relative p-1.5 rounded border border-[var(--cf-border)] text-[var(--cf-text-secondary)] hover:text-[var(--cf-text)] cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-[var(--cf-primary)] absolute -top-0.5 -right-0.5" />
            )}
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded border border-[var(--cf-border)] text-[var(--cf-text-secondary)] hover:text-[var(--cf-text)] cursor-pointer"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="p-1.5 rounded border border-[var(--cf-border)] text-[var(--cf-text)] cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[var(--cf-border)] bg-[var(--cf-surface)] px-5 py-4 space-y-4 z-30">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="text-[10px] font-mono-code font-semibold tracking-wider text-[var(--cf-text-secondary)] mb-1">
                {section.label}
              </p>
              <div className="space-y-1 text-sm">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `block px-2.5 py-1.5 rounded-md ${
                        isActive
                          ? 'bg-[var(--cf-primary)]/10 text-[var(--cf-primary)] font-semibold'
                          : 'text-[var(--cf-text-secondary)]'
                      }`
                    }
                  >
                    {item.name}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 border-r border-[var(--cf-border)] bg-[var(--cf-surface)] px-5 py-6 flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="font-bold text-base tracking-tight uppercase">
              CampusFlow
            </Link>
            <div className="flex items-center gap-1.5 relative">
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                title="Notifications"
                className="relative p-1.5 rounded border border-[var(--cf-border)] text-[var(--cf-text-secondary)] hover:text-[var(--cf-text)] cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5" />
                {notifications.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-[var(--cf-primary)] absolute -top-0.5 -right-0.5" />
                )}
              </button>
              <button
                onClick={toggleTheme}
                title="Toggle theme"
                className="p-1.5 rounded border border-[var(--cf-border)] text-[var(--cf-text-secondary)] hover:text-[var(--cf-text)] cursor-pointer"
              >
                {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={triggerCommandPalette}
            className="w-full mb-6 px-3 py-2 rounded-md border border-[var(--cf-border)] bg-[var(--cf-bg)] flex items-center justify-between text-xs text-[var(--cf-text-secondary)] hover:text-[var(--cf-text)] hover:border-[var(--cf-primary)] transition-colors cursor-pointer"
          >
            <span className="inline-flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[var(--cf-primary)]" />
              Quick Search...
            </span>
            <kbd className="px-1.5 py-0.5 rounded bg-[var(--cf-surface)] border border-[var(--cf-border)] font-mono-code text-[10px]">
              Ctrl K
            </kbd>
          </button>

          <div className="space-y-6">
            {NAV_SECTIONS.map((section) => (
              <div key={section.label}>
                <p className="text-[11px] font-mono-code font-semibold tracking-wider text-[var(--cf-text-secondary)] mb-2 px-2">
                  {section.label}
                </p>
                <nav className="space-y-0.5 text-sm">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `block px-2.5 py-1.5 rounded-md transition-colors ${
                          isActive
                            ? 'bg-[var(--cf-primary)]/10 text-[var(--cf-primary)] font-semibold'
                            : 'text-[var(--cf-text-secondary)] hover:text-[var(--cf-text)] hover:bg-[var(--cf-surface-muted)]'
                        }`
                      }
                    >
                      {item.name}
                    </NavLink>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </div>

        {user && (
          <div className="pt-4 border-t border-[var(--cf-border)]">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--cf-text)] truncate">
                  {user.full_name}
                </p>
                <p className="text-xs text-[var(--cf-text-secondary)] truncate">
                  Student · {user.department_code || 'Campus'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-2 rounded-md text-[var(--cf-text-secondary)] hover:text-rose-600 hover:bg-[var(--cf-surface-muted)] transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* In-App Notifications Popover (Stage C) */}
      {notifOpen && (
        <div className="fixed top-14 left-4 md:left-64 z-50 w-80 rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] shadow-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--cf-border)] bg-[var(--cf-bg)] flex items-center justify-between">
            <span className="text-[11px] font-mono-code font-bold uppercase text-[var(--cf-primary)]">
              IN-APP NOTIFICATIONS ({notifications.length})
            </span>
            <button
              type="button"
              onClick={() => setNotifOpen(false)}
              className="text-xs text-[var(--cf-text-secondary)] hover:text-[var(--cf-text)] cursor-pointer"
            >
              Close
            </button>
          </div>
          <div className="divide-y divide-[var(--cf-border)] max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-xs text-[var(--cf-text-secondary)]">No new notifications.</p>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  to={n.to}
                  onClick={() => setNotifOpen(false)}
                  className="p-3.5 block hover:bg-[var(--cf-surface-muted)] transition-colors"
                >
                  <div className="flex items-start gap-2.5">
                    {n.type === 'pass' ? (
                      <Ticket className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                    ) : (
                      <Megaphone className="w-4 h-4 text-[var(--cf-primary)] shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--cf-text)] truncate">
                        {n.title}
                      </p>
                      <p className="text-[11px] font-mono-code text-[var(--cf-text-secondary)] mt-0.5">
                        {n.meta}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}

      <main className="flex-1 px-5 sm:px-8 py-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
