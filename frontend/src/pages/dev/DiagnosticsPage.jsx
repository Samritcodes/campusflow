import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { apiRequest } from '../../services/api';

export default function DiagnosticsPage() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest('/health.php');
      setHealth(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] p-8">
        <div className="flex items-center justify-between border-b border-[var(--cf-border)] pb-5 mb-6">
          <div>
            <p className="text-xs font-mono-code uppercase tracking-widest text-[var(--cf-primary)]">
              INTERNAL DEVELOPER ROUTE · /dev/diagnostics
            </p>
            <h1 className="font-editorial text-3xl text-[var(--cf-text)] mt-1">
              CampusFlow Engine Diagnostics
            </h1>
          </div>
          <button
            onClick={checkHealth}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md border border-[var(--cf-border)] text-xs font-semibold hover:bg-[var(--cf-surface-muted)] cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-md border border-rose-500/30 bg-rose-500/10 text-rose-600 text-xs">
            {error}
          </div>
        )}

        {health && !loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono-code text-xs">
              <div className="p-4 rounded-md border border-[var(--cf-border)] bg-[var(--cf-bg)]">
                <p className="text-[var(--cf-text-secondary)]">PHP RUNTIME</p>
                <p className="text-base font-bold text-[var(--cf-text)] mt-1">v{health.data.php_version}</p>
              </div>
              <div className="p-4 rounded-md border border-[var(--cf-border)] bg-[var(--cf-bg)]">
                <p className="text-[var(--cf-text-secondary)]">DATABASE</p>
                <p className="text-base font-bold text-[var(--cf-text)] mt-1">{health.data.database}</p>
                <p className="text-[11px] text-[var(--cf-text-secondary)]">{health.data.mysql_version}</p>
              </div>
              <div className="p-4 rounded-md border border-[var(--cf-border)] bg-[var(--cf-bg)]">
                <p className="text-[var(--cf-text-secondary)]">STATUS</p>
                <p className="text-base font-bold text-[#059669] mt-1">ONLINE ✓</p>
              </div>
            </div>

            {health.data.tables && (
              <div>
                <p className="text-xs font-mono-code uppercase text-[var(--cf-text-secondary)] mb-2">
                  MYSQL TABLE ROW COUNTS
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {Object.entries(health.data.tables).map(([table, count]) => (
                    <div
                      key={table}
                      className="p-3 rounded-md border border-[var(--cf-border)] bg-[var(--cf-bg)] font-mono-code"
                    >
                      <p className="text-xs text-[var(--cf-text-secondary)]">{table}</p>
                      <p className="text-lg font-bold text-[var(--cf-text)] mt-1">{count}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
