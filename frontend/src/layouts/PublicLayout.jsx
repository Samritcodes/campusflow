import { useState } from 'react';
import { Outlet, Link, NavLink } from 'react-router-dom';
import { Sun, Moon, ArrowRight, Menu, X, Search } from 'lucide-react';
import { useAuth, getHomePathForRole } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { triggerCommandPalette } from '../components/common/CommandPalette';

export default function PublicLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--cf-bg)] text-[var(--cf-text)]">
      <header className="border-b border-[var(--cf-border)] bg-[var(--cf-surface)]/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--cf-primary)] transition-transform group-hover:scale-125" />
              <span className="font-editorial text-2xl tracking-tight text-[var(--cf-text)]">
                CampusFlow
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm text-[var(--cf-text-secondary)]">
              <NavLink
                to="/events"
                className={({ isActive }) =>
                  isActive
                    ? 'text-[var(--cf-text)] font-semibold'
                    : 'hover:text-[var(--cf-text)] transition-colors'
                }
              >
                Discover Events
              </NavLink>
              <a
                href="/#departments"
                className="hover:text-[var(--cf-text)] transition-colors"
              >
                Departments
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-2.5 text-sm">
            <button
              type="button"
              onClick={triggerCommandPalette}
              title="Quick Search (Ctrl+K)"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--cf-border)] bg-[var(--cf-bg)] text-xs text-[var(--cf-text-secondary)] hover:text-[var(--cf-text)] hover:border-[var(--cf-primary)] transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-[var(--cf-primary)]" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden md:inline-block px-1.5 py-0.5 rounded bg-[var(--cf-surface)] border border-[var(--cf-border)] font-mono-code text-[10px]">
                Ctrl K
              </kbd>
            </button>

            <button
              onClick={toggleTheme}
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              className="p-2 rounded-lg border border-[var(--cf-border)] text-[var(--cf-text-secondary)] hover:text-[var(--cf-text)] hover:bg-[var(--cf-surface-muted)] transition-colors cursor-pointer"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <div className="hidden sm:flex items-center gap-2.5">
              {user ? (
                <>
                  <Link
                    to={getHomePathForRole(user.role)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--cf-primary)] hover:bg-[var(--cf-primary-hover)] text-white font-semibold text-xs transition-colors"
                  >
                    {user.full_name.split(' ')[0]}’s Workspace <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={logout}
                    className="px-3 py-2 rounded-lg border border-[var(--cf-border)] text-[var(--cf-text-secondary)] hover:text-[var(--cf-text)] text-xs font-medium transition-colors cursor-pointer"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-3.5 py-2 rounded-lg text-[var(--cf-text)] hover:bg-[var(--cf-surface-muted)] font-semibold text-xs transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 rounded-lg bg-[var(--cf-primary)] hover:bg-[var(--cf-primary-hover)] text-white font-semibold text-xs transition-colors"
                  >
                    Create account
                  </Link>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden p-2 rounded-lg border border-[var(--cf-border)] text-[var(--cf-text)] cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--cf-border)] bg-[var(--cf-surface)] px-6 py-4 space-y-3 text-sm">
            <Link
              to="/events"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 font-semibold text-[var(--cf-text)]"
            >
              Discover Events
            </Link>
            <a
              href="/#departments"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-[var(--cf-text-secondary)]"
            >
              Departments
            </a>
            <div className="pt-2 border-t border-[var(--cf-border)] flex items-center gap-2">
              {user ? (
                <Link
                  to={getHomePathForRole(user.role)}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-lg bg-[var(--cf-primary)] text-white text-xs font-semibold"
                >
                  Open Workspace
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2 rounded-lg border border-[var(--cf-border)] text-xs font-semibold"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2 rounded-lg bg-[var(--cf-primary)] text-white text-xs font-semibold"
                  >
                    Create account
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-[var(--cf-border)] bg-[var(--cf-surface)] py-10 mt-16">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--cf-text-secondary)]">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[var(--cf-primary)]" />
            <span className="font-editorial text-lg text-[var(--cf-text)]">CampusFlow</span>
            <span>·</span>
            <span>University Event & Participation Platform</span>
          </div>
          <div className="flex items-center gap-5">
            <Link to="/events" className="hover:text-[var(--cf-text)]">Discover Events</Link>
            <Link to="/login" className="hover:text-[var(--cf-text)]">Sign in</Link>
            <Link to="/dev/diagnostics" className="font-mono-code hover:text-[var(--cf-text)]">
              System Status
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

