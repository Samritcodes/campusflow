import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, ArrowRight, Trophy, ShieldCheck, Award, FileSpreadsheet } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatEventDateLong, formatTime12h } from '../../utils/date';
import DigitalPassModal from '../../components/passes/DigitalPassModal';
import CertificateModal from '../../components/passes/CertificateModal';
import TranscriptModal from '../../components/passes/TranscriptModal';

export default function MyPassesPage() {
  const { user, refreshSession } = useAuth();
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPass, setSelectedPass] = useState(null);
  const [certificatePass, setCertificatePass] = useState(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const loadPasses = useCallback(() => {
    setLoading(true);
    apiRequest('/registrations/my-passes.php')
      .then((res) => setPasses(res.data?.passes || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadPasses();
  }, [loadPasses]);

  const handleCancelPass = async (pass) => {
    setCancelling(true);
    try {
      await apiRequest('/registrations/cancel.php', {
        method: 'POST',
        body: { pass_id: pass.pass_id },
      });
      await refreshSession();
      setSelectedPass(null);
      loadPasses();
    } catch {
      // handled
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="border-b border-[var(--cf-border)] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono-code uppercase tracking-widest text-[var(--cf-primary)]">
            PARTICIPATION WALLET & CCA PASSPORT
          </p>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[var(--cf-text)] mt-1">
            My events & digital passes
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowTranscript(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-[var(--cf-border)] bg-[var(--cf-surface)] hover:border-[var(--cf-primary)] text-[var(--cf-text)] text-xs font-semibold transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[var(--cf-primary)]" />
            Official CCA Transcript
          </button>
          <Link
            to="/student/discover"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[var(--cf-primary)] hover:bg-[var(--cf-primary-hover)] text-white text-xs font-semibold transition-colors"
          >
            Browse events <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {loading ? (
        <p className="text-sm text-[var(--cf-text-secondary)]">Loading your passes...</p>
      ) : passes.length === 0 ? (
        <div className="p-12 rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] text-center">
          <p className="text-base font-semibold text-[var(--cf-text)]">No digital passes yet</p>
          <p className="text-xs text-[var(--cf-text-secondary)] mt-1 mb-5">
            Register for any upcoming campus event to receive your verified CampusFlow Pass ID.
          </p>
          <Link
            to="/student/discover"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[var(--cf-primary)] text-white text-xs font-semibold"
          >
            Explore campus events
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {passes.map((pass) => {
            const isConfirmed = pass.status === 'CONFIRMED' || pass.status === 'ATTENDED';
            const isCancelled = pass.status === 'CANCELLED';
            const hasCert = pass.status === 'ATTENDED' || pass.status === 'COMPLETED' || Boolean(pass.award_title);
            const amountPaid = Number(pass.amount_paid ?? pass.registration_fee ?? 0);

            return (
              <div
                key={pass.id}
                onClick={() => setSelectedPass(pass)}
                className="group rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] hover:border-[var(--cf-primary)] transition-colors overflow-hidden cursor-pointer flex flex-col justify-between"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono-code text-xs font-bold text-[var(--cf-primary)]">
                      {pass.pass_id}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {pass.award_title && (
                        <span className="text-[10px] font-mono-code font-bold px-2 py-0.5 rounded border border-amber-500/40 bg-amber-500/15 text-amber-600">
                          🏆 {pass.award_title}
                        </span>
                      )}
                      <span className="text-[10px] font-mono-code font-bold px-2 py-0.5 rounded border border-[var(--cf-border)] bg-[var(--cf-bg)] text-[var(--cf-text)]">
                        {amountPaid > 0
                          ? `${pass.payment_status === 'REFUNDED' ? 'REFUNDED' : 'PAID'} · ₹${amountPaid}`
                          : 'FREE'}
                      </span>
                      <span
                        className={`text-[11px] font-mono-code font-semibold px-2.5 py-0.5 rounded border ${
                          isConfirmed
                            ? 'bg-[#059669]/10 text-[#059669] border-[#059669]/30'
                            : isCancelled
                            ? 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                        }`}
                      >
                        {pass.status} {isConfirmed ? '✓' : ''}
                      </span>
                    </div>
                  </div>

                  <h2 className="font-editorial text-2xl text-[var(--cf-text)] group-hover:text-[var(--cf-primary)] transition-colors">
                    {pass.event_title}
                  </h2>

                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    {pass.prize_pool && (
                      <p className="inline-flex items-center gap-1 text-xs font-medium text-[#059669]">
                        <Trophy className="w-3.5 h-3.5" /> {pass.prize_pool}
                      </p>
                    )}
                    {pass.team_name && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono-code font-semibold text-[var(--cf-primary)] bg-[var(--cf-primary)]/10 px-2 py-0.5 rounded">
                        Squad: {pass.team_name} {pass.team_code ? `(${pass.team_code})` : ''}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-dashed border-[var(--cf-border)] grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-[10px] font-mono-code uppercase text-[var(--cf-text-secondary)]">
                        DATE & TIME
                      </p>
                      <p className="font-semibold text-[var(--cf-text)] mt-0.5">
                        {formatEventDateLong(pass.event_date)}
                      </p>
                      <p className="font-mono-code text-[var(--cf-text-secondary)]">
                        {formatTime12h(pass.start_time)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-mono-code uppercase text-[var(--cf-text-secondary)]">
                        VENUE
                      </p>
                      <p className="font-semibold text-[var(--cf-text)] mt-0.5">{pass.venue}</p>
                      <p className="text-[var(--cf-text-secondary)]">{pass.department_code} Dept</p>
                    </div>
                  </div>

                  {pass.transaction_id && (
                    <div className="mt-3 pt-2.5 border-t border-[var(--cf-border)] flex items-center justify-between text-[11px] font-mono-code text-[var(--cf-text-secondary)]">
                      <span className="inline-flex items-center gap-1 text-[#059669]">
                        <ShieldCheck className="w-3.5 h-3.5" /> {pass.payment_method || 'UPI / QR'}
                      </span>
                      <span>{pass.transaction_id}</span>
                    </div>
                  )}
                </div>

                <div className="px-6 py-3 border-t border-[var(--cf-border)] bg-[var(--cf-bg)] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--cf-primary)]">
                      <Ticket className="w-3.5 h-3.5" /> Open pass & receipt
                    </span>
                    {hasCert && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCertificatePass(pass);
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-white text-[11px] font-semibold cursor-pointer ${
                          pass.award_title ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#059669] hover:bg-[#047857]'
                        }`}
                      >
                        <Award className="w-3 h-3" /> {pass.award_title ? 'Merit Certificate' : 'Certificate'}
                      </button>
                    )}
                  </div>
                  <Link
                    to={`/student/events/${pass.event_slug}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-[var(--cf-text-secondary)] hover:text-[var(--cf-text)]"
                  >
                    Event page →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <DigitalPassModal
        pass={selectedPass}
        onClose={() => setSelectedPass(null)}
        onCancelPass={handleCancelPass}
        cancelling={cancelling}
      />

      <CertificateModal
        pass={certificatePass}
        onClose={() => setCertificatePass(null)}
      />

      {showTranscript && (
        <TranscriptModal
          user={user}
          passes={passes}
          onClose={() => setShowTranscript(false)}
        />
      )}
    </div>
  );
}
