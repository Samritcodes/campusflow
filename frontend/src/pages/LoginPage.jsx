import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth, getHomePathForRole } from '../context/AuthContext';

const DEV_ACCOUNTS = [
  { name: 'Arav Mehta', roleLabel: 'Student', email: 'arav@campusflow.edu' },
  { name: 'Dr. Priya Mehta', roleLabel: 'Organizer', email: 'priya.mehta@campusflow.edu' },
  { name: 'Ram Prakash Pradhan', roleLabel: 'Dept Manager', email: 'ram.pradhan@campusflow.edu' },
  { name: 'Samrit Kumar Bhutia', roleLabel: 'Admin', email: 'samrit@campusflow.edu' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const loggedInUser = await login(email, password);
      navigate(getHomePathForRole(loggedInUser.role), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError(null);
    setSubmitting(true);
    try {
      const loggedInUser = await login(demoEmail, 'password123');
      navigate(getHomePathForRole(loggedInUser.role), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="mb-8">
        <p className="text-xs font-mono-code uppercase tracking-widest text-[var(--cf-primary)]">
          UNIVERSITY PORTAL
        </p>
        <h1 className="font-editorial text-4xl text-[var(--cf-text)] mt-1">
          Sign in to CampusFlow
        </h1>
        <p className="text-sm text-[var(--cf-text-secondary)] mt-1.5">
          Enter your institutional email to access events, passes, and department tools.
        </p>
      </div>

      <div className="rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] p-7">
        {error && (
          <div className="mb-5 p-3.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 flex items-center gap-2.5 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--cf-text)] mb-1.5">
              Institutional Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@campusflow.edu"
              className="w-full px-3.5 py-2.5 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)] text-[var(--cf-text)] placeholder-[var(--cf-text-secondary)]/60 focus:outline-none focus:border-[var(--cf-primary)] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--cf-text)] mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)] text-[var(--cf-text)] placeholder-[var(--cf-text-secondary)]/60 focus:outline-none focus:border-[var(--cf-primary)] text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 rounded-md bg-[var(--cf-primary)] hover:bg-[var(--cf-primary-hover)] disabled:opacity-50 font-semibold text-sm text-white transition-colors cursor-pointer mt-2"
          >
            {submitting ? 'Signing in...' : 'Continue'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[var(--cf-border)] text-center text-xs text-[var(--cf-text-secondary)]">
          New student on campus?{' '}
          <Link to="/register" className="text-[var(--cf-primary)] font-semibold hover:underline">
            Create student account
          </Link>
        </div>
      </div>

      {/* Hidden-by-default Developer Tools Drawer (disabled when VITE_APP_ENV === 'production') */}
      {import.meta.env.VITE_APP_ENV !== 'production' && (
        <div className="mt-8">
          <button
            type="button"
            onClick={() => setShowDevTools((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-dashed border-[var(--cf-border)] text-[11px] font-mono-code text-[var(--cf-text-secondary)] hover:text-[var(--cf-text)] cursor-pointer"
          >
            <span>Developer tools (seed account switcher)</span>
            {showDevTools ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showDevTools && (
            <div className="mt-2 p-3 rounded-md border border-[var(--cf-border)] bg-[var(--cf-surface)] space-y-1.5">
              {DEV_ACCOUNTS.map((acct) => (
                <button
                  key={acct.email}
                  type="button"
                  disabled={submitting}
                  onClick={() => handleQuickLogin(acct.email)}
                  className="w-full text-left px-3 py-2 rounded hover:bg-[var(--cf-surface-muted)] flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer"
                >
                  <span className="font-medium text-[var(--cf-text)] truncate">{acct.name}</span>
                  <span className="font-mono-code text-[10px] px-2 py-0.5 rounded border border-[var(--cf-border)] text-[var(--cf-text-secondary)] shrink-0">
                    {acct.roleLabel}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
