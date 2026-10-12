import { useState } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { Sun, Moon, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const NAV_SECTIONS = [
  {
    label: 'OVERVIEW',
    items: [
      { name: 'Dashboard & Roster', to: '/organizer', end: true },
      { name: 'Calendar & Reminders', to: '/organizer/calendar' },
      { name: 'Analytics & Insights', to: '/organizer/analytics' },
      { name: 'Public Calendar', to: '/events' },
    ],
  },
  {
    label: 'MANAGEMENT',
    items: [
      { name: 'Verify Pass', to: '/organizer/verify-pass' },
      { name: 'Announcements', to: '/organizer/announcements' },
      { name: 'Department Roles', to: '/organizer/team' },
    ],
  },
];

export default function OrganizerLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const roleText =
    user?.role === 'DEPARTMENT_MANAGER' ? 'Department Manager' : 'Organizer';

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--cf-bg)] text-[var(--cf-text)]">
      {/* Mobile Header Bar (< 768px) */}
      <div className="md:hidden px-5 py-3.5 border-b border-[var(--cf-border)] bg-[var(--cf-surface)] flex items-center justify-between sticky top-0 z-40">
        <div>
          <Link to="/" className="font-bold text-base tracking-tight uppercase block">
            CampusFlow
          </Link>
          <span className="text-[10px] font-mono-code uppercase text-[var(--cf-text-secondary)]">
            {roleText}
          </span>
        </div>
        <div className="flex items-center gap-2">
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
                    key={item.name}
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

      <aside className="hidden md:flex w-60 border-r border-[var(--cf-border)] bg-[var(--cf-surface)] px-5 py-6 flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link to="/" className="font-bold text-base tracking-tight uppercase block">
                CampusFlow
              </Link>
              <span className="text-[10px] font-mono-code uppercase tracking-wider text-[var(--cf-text-secondary)]">
                {roleText}
              </span>
            </div>
            <button
              onClick={toggleTheme}
              title="Toggle theme"
              className="p-1.5 rounded border border-[var(--cf-border)] text-[var(--cf-text-secondary)] hover:text-[var(--cf-text)] cursor-pointer"
            >
              {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="space-y-6">
            {NAV_SECTIONS.map((section) => (
              <div key={section.label}>
                <p className="text-[11px] font-mono-code font-semibold tracking-wider text-[var(--cf-text-secondary)] mb-2 px-2">
                  {section.label}
                </p>
                <nav className="space-y-0.5 text-sm">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.name}
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
                  {roleText} · {user.department_code || 'Campus'}
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

      <main className="flex-1 px-5 sm:px-8 py-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
